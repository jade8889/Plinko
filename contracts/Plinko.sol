// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./Common.sol";

/**
 * @title plinko game, players select a number of rows and risk and get payouts depending on the final position of the ball
 */
contract Plinko is Common, ChainlinkClient, ConfirmedOwner {
  using SafeERC20 for IERC20;

  address private oracleAddress;
  bytes32 private jobId;
  uint256 private fee;

  constructor(
    address _bankroll,
    address _forwarder,
    address _oracle,
    string memory _jobId,
    uint256 _fee
  ) ConfirmedOwner(msg.sender) ReentrancyGuard() {
    Bankroll = IBankRoll(_bankroll);
    _trustedForwarder = _forwarder;
    setChainlinkToken(0x88038752750D7717a19F2A681eF75e65Fb714f1E); // Set your LINK token address
    setOracleAddress(_oracle);
    setJobId(_jobId);
    setFeeInJuels(_fee);

    kellyFractions[0] = [573159, 240816, 372158, 267835, 453230, 480140, 327817, 384356, 467936];
    kellyFractions[1] = [108157, 100164, 100856, 82065, 91981, 83772, 68092, 69475, 100288];
    kellyFractions[2] = [31369, 25998, 38394, 27787, 29334, 29004, 22764, 21439, 27190];
  }

  struct PlinkoGame {
    uint256 wager;
    uint256 stopGain;
    uint256 stopLoss;
    bytes32 requestID;
    address tokenAddress;
    uint64 blockNumber;
    uint256 numBets;
    uint8 risk;
    uint8 numRows;
  }

  mapping(address => PlinkoGame) plinkoGames;
  mapping(bytes32 => address) plinkoIDs;
  mapping(uint8 => mapping(uint8 => mapping(uint8 => uint256))) plinkoMultipliers;
  mapping(uint8 => mapping(uint8 => bool)) isMultiplierSet;
  uint256[9][3] kellyFractions;

  event Plinko_Play_Event(
    address indexed playerAddress,
    uint256 wager,
    address tokenAddress,
    uint8 numRows,
    uint8 risk,
    uint256 numBets,
    uint256 stopGain,
    uint256 stopLoss,
    uint256 VRFFee
  );

  event Plinko_Outcome_Event(
    address indexed playerAddress,
    uint256 wager,
    uint256 payout,
    address tokenAddress,
    uint16[] paths,
    uint8 numRows,
    uint8 risk,
    uint256[] payouts,
    uint32 numGames
  );

  event Plinko_Refund_Event(address indexed player, uint256 wager, address tokenAddress);

  error AwaitingVRF(bytes32 requestID);
  error InvalidNumRows();
  error InvalidRisk();
  error InvalidNumBets(uint256 maxNumBets);
  error OnlyCoordinatorCanFulfill(address have, address want);
  error WagerAboveLimit(uint256 wager, uint256 maxWager);
  error NotAwaitingVRF();
  error BlockNumberTooLow(uint256 have, uint256 want);
  error MismatchedLength(uint256 multipliers, uint256 outcome);
  error MultiplierAlreadySet(uint8 numRows, uint8 risk);
  error InvalidNumberToSet();

  function setOracleAddress(address _oracleAddress) public onlyOwner {
    oracleAddress = _oracleAddress;
    setChainlinkOracle(_oracleAddress);
  }

  function setJobId(string memory _jobId) public onlyOwner {
    jobId = bytes32(bytes(_jobId));
  }

  function setFeeInJuels(uint256 _feeInJuels) public onlyOwner {
    fee = _feeInJuels;
  }

  function Plinko_Play(
    uint256 wager,
    address tokenAddress,
    uint8 numRows,
    uint8 risk,
    uint256 numBets,
    uint256 stopGain,
    uint256 stopLoss
  ) external payable nonReentrant {
    address msgSender = _msgSender();
    if (numRows < 8 || numRows > 16) {
      revert InvalidNumRows();
    }
    if (risk >= 3) {
      revert InvalidRisk();
    }
    if (plinkoGames[msgSender].requestID != 0) {
      revert AwaitingVRF(plinkoGames[msgSender].requestID);
    }
    if (!(numBets > 0 && numBets <= 100)) {
      revert InvalidNumBets(100);
    }

    _kellyWager(wager, tokenAddress, numRows, risk);
    // uint256 fee = _transferWager(tokenAddress, wager * numBets, msgSender);
    _transferWager(tokenAddress, wager * numBets, msgSender);
    bytes32 id = requestRandomWords();

    plinkoGames[msgSender] = PlinkoGame(
      wager,
      stopGain,
      stopLoss,
      id,
      tokenAddress,
      uint64(block.number),
      numBets,
      risk,
      numRows
    );
    plinkoIDs[id] = msgSender;

    emit Plinko_Play_Event(
      msgSender,
      wager,
      tokenAddress,
      numRows,
      risk,
      numBets,
      stopGain,
      stopLoss,
      fee
    );
  }

  function requestRandomWords() internal returns (bytes32 requestId) {
    Chainlink.Request memory req = buildOperatorRequest(jobId, this.fulfillRandomWords.selector);
    requestId = sendOperatorRequest(req, fee);
  }

  function fulfillRandomWords(
    bytes32 requestId,
    uint256[] memory randomWords
  ) public recordChainlinkFulfillment(requestId) {
    // Implement the fulfillment logic based on your requirements
    address playerAddress = plinkoIDs[requestId];
    if (playerAddress == address(0)) revert();
    PlinkoGame storage game = plinkoGames[playerAddress];
    if (block.number > game.blockNumber + 1000) revert();

    uint16[] memory gamesResults = new uint16[](game.numBets);
    uint256[] memory payouts = new uint256[](game.numBets);

    int256 totalValue;
    uint256 payout;
    uint32 i;
    uint256 multiplier;

    address tokenAddress = game.tokenAddress;

    for (i = 0; i < game.numBets; i++) {
      if (totalValue >= int256(game.stopGain)) {
        break;
      }
      if (totalValue <= -int256(game.stopLoss)) {
        break;
      }

      (multiplier, gamesResults[i]) = _plinkoGame(randomWords[i], game.numRows, game.risk);

      payouts[i] = (game.wager * multiplier) / 100;
      payout += payouts[i];
      totalValue += int256(payouts[i]) - int256(game.wager);
    }

    payout += (game.numBets - i) * game.wager;

    emit Plinko_Outcome_Event(
      playerAddress,
      game.wager,
      payout,
      tokenAddress,
      gamesResults,
      game.numRows,
      game.risk,
      payouts,
      i
    );
    _transferToBankroll(tokenAddress, game.wager * game.numBets);
    delete (plinkoIDs[requestId]);
    delete (plinkoGames[playerAddress]);
    if (payout != 0) {
      _transferPayout(playerAddress, payout, tokenAddress);
    }
  }

  function _plinkoGame(
    uint256 randomWords,
    uint8 numRows,
    uint8 risk
  ) internal view returns (uint256 multiplier, uint16 currentGameResult) {
    int8 ended = 0;
    for (uint8 g = 0; g < numRows; g++) {
      bool bitValue = _getBitValue(randomWords, g);
      if (bitValue) {
        ended += 1;
        currentGameResult = setBit(currentGameResult, g);
      } else {
        ended -= 1;
      }
    }
    uint8 multiplierSlot = uint8(ended + int8(numRows)) >> 1;
    multiplier = plinkoMultipliers[risk][numRows][multiplierSlot];
  }

  function _getBitValue(uint256 four_nibbles, uint256 index) internal pure returns (bool) {
    return (four_nibbles & (1 << index)) != 0;
  }

  uint16 internal constant ONE = uint16(1);

  function setBit(uint16 self, uint8 index) internal pure returns (uint16) {
    return self | (ONE << index);
  }

  function _kellyWager(
    uint256 wager,
    address tokenAddress,
    uint8 numRows,
    uint8 risk
  ) internal view {
    uint256 balance;
    if (tokenAddress == address(0)) {
      balance = address(Bankroll).balance;
    } else {
      balance = IERC20(tokenAddress).balanceOf(address(Bankroll));
    }
    uint256 maxWager = (balance * kellyFractions[risk][numRows - 8]) / 100000000;
    if (wager > maxWager) {
      revert WagerAboveLimit(wager, maxWager);
    }
  }
}
