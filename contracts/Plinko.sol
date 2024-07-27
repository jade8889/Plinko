// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "./Common.sol";

/**
 * @title Plinko game, players select a number of rows and get payouts depending on the final position of the ball
 */
contract Plinko is Common {
  using SafeERC20 for IERC20;
  using Chainlink for Chainlink.Request;

  struct LightningMultiplier {
    uint8 row;
    uint8 position;
    uint256 multiplier;
  }

  mapping(uint256 => LightningMultiplier[]) public lightningMultipliers;
  uint256 public lightningModeFee;
  bool public lightningModeActive;

  constructor(address _bankroll, address _linkToken, address _forwarder) Common(_linkToken) {
    Bankroll = IBankRoll(_bankroll);
    _trustedForwarder = _forwarder;
    lightningModeActive = false;
    lightningModeFee = 0.01 ether; // Example fee for activating lightning mode
  }

  struct PlinkoGame {
    uint256 wager;
    uint256 stopGain;
    uint256 stopLoss;
    uint256 requestID;
    address tokenAddress;
    uint64 blockNumber;
    uint32 numBets;
    uint8 risk;
    uint8 numRows;
  }

  mapping(address => PlinkoGame) plinkoGames;
  mapping(uint256 => address) plinkoIDs;
  mapping(uint8 => mapping(uint8 => mapping(uint8 => uint256))) plinkoMultipliers;
  mapping(uint8 => mapping(uint8 => bool)) isMultiplierSet;
  uint256[9][3] kellyFractions;

  event Plinko_Play_Event(
    address indexed playerAddress,
    uint256 wager,
    address tokenAddress,
    uint8 numRows,
    uint8 risk,
    uint32 numBets,
    uint256 stopGain,
    uint256 stopLoss,
    uint256 VRFFee,
    bool lightningModeActive
  );
  event Plinko_Refund_Event(address indexed playerAddress, uint256 wager, address tokenAddress);
  event Plinko_Outcome_Event(
    address indexed playerAddress,
    uint256 wager,
    uint256 payout,
    address tokenAddress,
    uint16[] paths,
    uint8 numRows,
    uint8 risk,
    uint256[] payouts,
    uint32 numBets
  );

  error AwaitingVRF(uint256 requestID);
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

  function setPlinkoKellyFractions(uint256[9][3] calldata _kellyFractions) external onlyOwner {
    for (uint8 r = 0; r < 3; r++) {
      for (uint8 p = 0; p < 9; p++) {
        kellyFractions[r][p] = _kellyFractions[r][p];
      }
    }
  }

  function setPlinkoMultipliers(
    uint256[17][9][3] calldata _plinkoMultipliers,
    uint256[9][3] calldata _kellyFractions
  ) external onlyOwner {
    for (uint8 r = 0; r < 9; r++) {
      for (uint8 p = 0; p < (r + 1); p++) {
        for (uint8 q = 0; q < 3; q++) {
          plinkoMultipliers[r][p][q] = _plinkoMultipliers[r][p][q];
        }
      }
    }

    for (uint8 r = 0; r < 3; r++) {
      for (uint8 p = 0; p < 9; p++) {
        kellyFractions[r][p] = _kellyFractions[r][p];
      }
    }
  }

  function Plinko_GetKelly(uint8 risk) external view returns (uint256[9] memory kelly) {
    return kellyFractions[risk];
  }

  function Plinko_SetMultipliers(
    uint8 numRows,
    uint8 risk,
    uint256[17] calldata multipliers
  ) external onlyOwner {
    if (numRows % 2 == 0 || numRows == 1) {
      revert InvalidNumRows();
    }
    if (risk >= 3) {
      revert InvalidRisk();
    }
    if (isMultiplierSet[numRows][risk]) {
      revert MultiplierAlreadySet(numRows, risk);
    }

    for (uint8 i = 0; i <= numRows; i++) {
      plinkoMultipliers[numRows][i][risk] = multipliers[i];
    }
    isMultiplierSet[numRows][risk] = true;
  }

  function Plinko_RefundPlayer(address player) external {
    PlinkoGame storage plinkoGame = plinkoGames[player];
    address tokenAddress = plinkoGame.tokenAddress;
    uint256 wager = plinkoGame.wager;
    if (tokenAddress == address(0)) {
      (bool success, ) = player.call{ value: wager }("");
      if (!success) {
        revert TransferFailed();
      }
    } else {
      IERC20(tokenAddress).safeTransfer(player, wager);
    }
    emit Plinko_Refund_Event(player, wager, tokenAddress);
    delete (plinkoGames[player]);
  }

  function Plinko_CashOut(address player, uint256 payout) external onlyOwner {
    PlinkoGame storage plinkoGame = plinkoGames[player];
    Bankroll.transferPayout(player, payout, plinkoGame.tokenAddress);
    delete (plinkoGames[player]);
  }

  function Plinko_Play(
    uint8 numRows,
    uint8 risk,
    uint32 numBets,
    address tokenAddress,
    uint256 wager,
    uint256 stopGain,
    uint256 stopLoss
  )
    external
    payable
    // bool lightningModeActive
    nonReentrant
  {
    if (plinkoGames[msg.sender].requestID != 0) {
      revert AwaitingVRF(plinkoGames[msg.sender].requestID);
    }
    if (numRows % 2 == 0 || numRows == 1 || numRows > 17) {
      revert InvalidNumRows();
    }
    if (risk >= 3) {
      revert InvalidRisk();
    }
    if (numBets == 0) {
      revert InvalidNumBets(numBets);
    }

    uint256 VRFFee = _transferWager(tokenAddress, wager, msg.sender);

    uint256 requestId = _requestRandomWords();
    plinkoGames[msg.sender] = PlinkoGame({
      wager: wager,
      stopGain: stopGain,
      stopLoss: stopLoss,
      requestID: requestId,
      tokenAddress: tokenAddress,
      blockNumber: uint64(block.number),
      numBets: numBets,
      risk: risk,
      numRows: numRows
    });
    plinkoIDs[requestId] = msg.sender;

    emit Plinko_Play_Event(
      msg.sender,
      wager,
      tokenAddress,
      numRows,
      risk,
      numBets,
      stopGain,
      stopLoss,
      VRFFee,
      lightningModeActive
    );
  }

  function _requestRandomWords(
    uint256 _betAmount,
    uint256 _group
  ) internal returns (bytes32 requestId) {
    Chainlink.Request memory req = buildChainlinkRequest(
      jobId,
      address(this),
      this.fulfillRandomWords.selector
    );

    requestId = sendChainlinkRequestTo(oracle, req, fee);

    s_requests[requestId] = RequestStatus({
      randomWord: 0,
      exists: true,
      fulfilled: false,
      betAmount: _betAmount,
      bettor: msg.sender,
      group: _group
    });

    emit RequestSent(requestId, msg.sender);
    return requestId;
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    address player = plinkoIDs[requestId];
    PlinkoGame storage plinkoGame = plinkoGames[player];

    uint8 numRows = plinkoGame.numRows;
    uint8 risk = plinkoGame.risk;
    uint32 numBets = plinkoGame.numBets;
    uint256 wager = plinkoGame.wager;
    uint256 stopGain = plinkoGame.stopGain;
    uint256 stopLoss = plinkoGame.stopLoss;
    address tokenAddress = plinkoGame.tokenAddress;

    uint16[] memory paths = new uint16[](numBets);
    uint256[] memory payouts = new uint256[](numBets);
    uint256 totalPayout = 0;

    for (uint32 i = 0; i < numBets; i++) {
      uint256 r = uint256(keccak256(abi.encode(randomWords[i]))) % 2 ** numRows;
      paths[i] = uint16(r);
      uint8 position = 0;
      for (uint8 j = 0; j < numRows; j++) {
        position += uint8((r >> j) & 1);
      }
      payouts[i] = (wager * plinkoMultipliers[numRows][position][risk]) / 1000;
      totalPayout += payouts[i];

      if (totalPayout >= stopGain || totalPayout <= stopLoss) {
        break;
      }
    }

    if (totalPayout > 0) {
      Bankroll.transferPayout(player, totalPayout, tokenAddress);
    }

    emit Plinko_Outcome_Event(
      player,
      wager,
      totalPayout,
      tokenAddress,
      paths,
      numRows,
      risk,
      payouts,
      numBets
    );

    delete (plinkoGames[player]);
    delete (plinkoIDs[requestId]);
  }
}
