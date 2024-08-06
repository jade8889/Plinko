// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBankRoll {
  function getIsGame(address game) external view returns (bool);
  function getIsValidWager(address game, address tokenAddress) external view returns (bool);
  function transferPayout(address player, uint256 payout, address token) external;
  function getOwner() external view returns (address);
  function isPlayerSuspended(address player) external view returns (bool, uint256);
}

contract Common is ReentrancyGuard {
  using SafeERC20 for IERC20;

  address public _trustedForwarder;
  IBankRoll public Bankroll;

  error NotApprovedBankroll();
  error InvalidValue(uint256 required, uint256 sent);
  error TransferFailed();
  error RefundFailed();
  error NotOwner(address want, address have);
  error ZeroWager();
  error PlayerSuspended(uint256 suspensionTime);

  /**
   * @dev function to transfer the player wager to bankroll
   * , reverts if bankroll doesn't approve game or token
   * @param tokenAddress address of the token the wager is made on
   * @param wager total amount wagered
   */
  function _transferWager(address tokenAddress, uint256 wager, address msgSender) internal {
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
      IERC20(tokenAddress).safeTransferFrom(msgSender, address(this), wager);
    }
  }

  /**
   * @dev function to transfer the wager held by the game contract to the bankroll
   * @param tokenAddress address of the token to transfer
   * @param amount token amount to transfer
   */
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

  /**
   * @dev returns to user the excess fee sent to pay for the VRF
   * @param refund amount to send back to user
   */
  function _refundExcessValue(uint256 refund) internal {
    if (refund == 0) {
      return;
    }
    (bool success, ) = payable(msg.sender).call{ value: refund }("");
    if (!success) {
      revert RefundFailed();
    }
  }

  /**
   * @dev transfers payout from the game contract to the players
   * @param player address of the player to transfer the payout to
   * @param payout amount of payout to transfer
   * @param tokenAddress address of the token that payout will be transferred
   */
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

  /**
   * @dev function to request bankroll to give payout to player
   * @param player address of the player
   * @param payout amount of payout to give
   * @param tokenAddress address of the token in which to give the payout
   */
  function _transferPayout(address player, uint256 payout, address tokenAddress) internal {
    Bankroll.transferPayout(player, payout, tokenAddress);
  }

  function isTrustedForwarder(address forwarder) public view returns (bool) {
    return forwarder == _trustedForwarder;
  }

  function _msgSender() internal view returns (address ret) {
    if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
      // At this point we know that the sender is a trusted forwarder,
      // so we trust that the last bytes of msg.data are the verified sender address.
      // extract sender address from the end of msg.data
      assembly {
        ret := shr(96, calldataload(sub(calldatasize(), 20)))
      }
    } else {
      ret = msg.sender;
    }
  }
}
