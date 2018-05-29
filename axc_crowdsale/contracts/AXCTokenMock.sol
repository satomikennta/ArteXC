pragma solidity ^0.4.18;
import "./AXCToken.sol";

contract AXCTokenMock is AXCToken {
  function AXCTokenMock(address initialAccount, uint initialBalance, uint256 _cap) public
  AXCToken(_cap)
  {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
