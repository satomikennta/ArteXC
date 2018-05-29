pragma solidity ^0.4.18;
import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract AXCToken is CappedToken, BurnableToken, PausableToken {
  string public constant name = "ArteryexCoin";
  string public constant symbol = "AXC";
  uint8 public constant decimals = 18;

  function AXCToken(uint256 _cap) public
  CappedToken(_cap)
  {
  }

}
