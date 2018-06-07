pragma solidity ^0.4.18;
import "./AXCToken.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";


contract AXCCrowdsale is CappedCrowdsale, MintedCrowdsale, TimedCrowdsale, RefundableCrowdsale {

    bool private allocFinished = false;

    function AXCCrowdsale(
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        uint256 _goal,
        address _wallet,
        uint256 _cap,
        MintableToken _token
    )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    RefundableCrowdsale(_goal)
    TimedCrowdsale(_openingTime, _closingTime) {
        require(_goal <= _cap);
    }

    // Mint AXCtoken for Team and Reservation.
    // This function should be triggered by owner after closingTime.
    // Amount of totalAXC depends on totalSupply at Crowdsale.
    // Mint 15% of totalAXC for Team.
    // Mint 50% of totalAXC for Reservation.
    function MintForAlloc(address team, address reserve) public onlyOwner() {
        require(hasClosed());
        require(allocFinished == false);
        uint256 totalAXC = token.totalSupply().mul(100).div(35);
        uint256 amountForTeam = totalAXC.mul(15).div(100);
        uint256 amountForReserve = totalAXC.div(2);
        AXCToken(token).mint(team, amountForTeam);
        AXCToken(token).mint(reserve, amountForReserve);
        allocFinished = true;
    }

    //override _getTokenAmount() in zeppelin-solidity in order to change purchase_rate at every stage.
    //initial rate is 12000.
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        uint256 periodOfPreSale = openingTime.add(3 minutes);
        uint256 periodOfWeek1 = openingTime.add(6 minutes);
        uint256 periodOfWeek2 = openingTime.add(9 minutes);
        uint256 periodOfWeek3 = openingTime.add(12 minutes);
        if (now > periodOfPreSale && now < periodOfWeek1) {
            rate = 11500;
        }else if (now > periodOfWeek1 && now < periodOfWeek2) {
            rate = 11000;
        }else if (now > periodOfWeek2 && now < periodOfWeek3) {
            rate = 10500;
        }else if (now > periodOfWeek3 && now < closingTime) {
            rate = 10000;
        }
        return _weiAmount.mul(rate);
    }
}
