// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBankRoll {
  function getIsGame(address game) external view returns (bool);
  function getIsValidWager(address game, address tokenAddress) external view returns (bool);
  function transferPayout(address player, uint256 payout, address token) external;
  function getOwner() external view returns (address);
  function isPlayerSuspended(address player) external view returns (bool, uint256);
}

contract Common is ChainlinkClient, ConfirmedOwner, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using Chainlink for Chainlink.Request;

  uint256 public VRFFees;
  address public _trustedForwarder;

  uint64 constant BLOCK_NUMBER_REFUND = 1000;

  IBankRoll public Bankroll;

  error NotApprovedBankroll();
  error InvalidValue(uint256 required, uint256 sent);
  error TransferFailed();
  error RefundFailed();
  error NotOwner(address want, address have);
  error ZeroWager();
  error PlayerSuspended(uint256 suspensionTime);

  constructor(address _linkToken) ConfirmedOwner(msg.sender) {
    setChainlinkToken(_linkToken);
  }

  function _transferWager(
    address tokenAddress,
    uint256 wager,
    address msgSender
  ) internal returns (uint256 VRFfee) {
    if (!Bankroll.getIsValidWager(address(this), tokenAddress)) {
      revert NotApprovedBankroll();
    }
    if (wager == 0) {
      revert ZeroWager();
    }
    (bool suspended, uint256 suspendedTime) = Bankroll.isPlayerSuspended(msgSender);
    if (suspended) {
      revert PlayerSuspended(suspendedTime);
    }

    if (tokenAddress == address(0)) {
      if (msg.value < wager) {
        revert InvalidValue(wager, msg.value);
      }
      _refundExcessValue(msg.value - wager);
    } else {
      if (msg.value < VRFfee) {
        revert InvalidValue(VRFfee, msg.value);
      }
      IERC20(tokenAddress).safeTransferFrom(msgSender, address(this), wager);
      _refundExcessValue(msg.value - VRFfee);
    }
    VRFFees += VRFfee;
  }

  function _transferToBankroll(address tokenAddress, uint256 amount) internal {
    if (tokenAddress == address(0)) {
      (bool success, ) = payable(address(Bankroll)).call{ value: amount }("");
      if (!success) {
        revert RefundFailed();
      }
    } else {
      IERC20(tokenAddress).safeTransfer(address(Bankroll), amount);
    }
  }

  function _refundExcessValue(uint256 refund) internal {
    if (refund == 0) {
      return;
    }
    (bool success, ) = payable(msg.sender).call{ value: refund }("");
    if (!success) {
      revert RefundFailed();
    }
  }

  function transferFees(address to) external nonReentrant onlyOwner {
    uint256 fee = VRFFees;
    VRFFees = 0;
    (bool success, ) = payable(address(to)).call{ value: fee }("");
    if (!success) {
      revert TransferFailed();
    }
  }

  function _transferWagerPvPNoVRF(address tokenAddress, uint256 wager) internal {
    if (!Bankroll.getIsValidWager(address(this), tokenAddress)) {
      revert NotApprovedBankroll();
    }
    if (tokenAddress == address(0)) {
      if (!(msg.value == wager)) {
        revert InvalidValue(wager, msg.value);
      }
    } else {
      IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), wager);
    }
  }

  function _transferWagerPvP(address tokenAddress, uint256 wager) internal {
    if (!Bankroll.getIsValidWager(address(this), tokenAddress)) {
      revert NotApprovedBankroll();
    }

    if (tokenAddress == address(0)) {
      if (msg.value < wager) {
        revert InvalidValue(wager, msg.value);
      }
      _refundExcessValue(msg.value - wager);
    } else {
      if (msg.value < VRFFees) {
        revert InvalidValue(VRFFees, msg.value);
      }
      IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), wager);
      _refundExcessValue(msg.value - VRFFees);
    }
    VRFFees += VRFFees;
  }

  function _transferPayoutPvP(address player, uint256 payout, address tokenAddress) internal {
    if (tokenAddress == address(0)) {
      (bool success, ) = payable(player).call{ value: payout }("");
      if (!success) {
        revert TransferFailed();
      }
    } else {
      IERC20(tokenAddress).safeTransfer(player, payout);
    }
  }

  function _transferHouseEdgePvP(uint256 amount, address tokenAddress) internal {
    if (tokenAddress == address(0)) {
      (bool success, ) = payable(address(Bankroll)).call{ value: amount }("");
      if (!success) {
        revert TransferFailed();
      }
    } else {
      IERC20(tokenAddress).safeTransfer(address(Bankroll), amount);
    }
  }

  function _transferPayout(address player, uint256 payout, address tokenAddress) internal {
    Bankroll.transferPayout(player, payout, tokenAddress);
  }

  function isTrustedForwarder(address forwarder) public view returns (bool) {
    return forwarder == _trustedForwarder;
  }

  function _msgSender() internal view returns (address ret) {
    if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
      assembly {
        ret := shr(96, calldataload(sub(calldatasize(), 20)))
      }
    } else {
      ret = msg.sender;
    }
  }
}
