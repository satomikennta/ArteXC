import ether from 'zeppelin-solidity/test/helpers/ether';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from 'zeppelin-solidity/test/helpers/EVMRevert';


const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AXCCrowdsale = artifacts.require('./AXCCrowdsale.sol');
const AXCToken = artifacts.require('./AXCToken.sol');
const RefundVault = artifacts.require('zeppelin-solidity/contracts/crowdsale/distribution/utils/RefundVault.sol');

contract('AXCCrowdsale', function ([_, owner, investor, wallet, purchaser, thirdparty]) {
  const rate = new BigNumber(12000);
  const value = ether(1);
  const tokenSupply = new BigNumber('1e22');
  const goal = ether(10);
  const lessThanGoal = ether(8);
  const cap = ether(15);
  const lessThanCap = ether(3);
  const tokencap = web3.toWei(10000000 , 'ether');
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.minutes(3);
    this.closingTime = this.openingTime + duration.minutes(20);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await AXCToken.new(tokencap);
    this.preSalePeriod = this.openingTime + duration.minutes(3);
    this.week1Period = this.openingTime + duration.minutes(6);
    this.week2Period = this.openingTime + duration.minutes(9);
    this.week3Period = this.openingTime + duration.minutes(12);
    this.vault = await RefundVault.new(wallet, { from: owner });
    this.crowdsale = await AXCCrowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      goal,
      wallet,
      cap,
      this.token.address, { from: owner});
    await this.token.transferOwnership(this.crowdsale.address);
  });

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasClosed();
    ended.should.equal(false);
    await increaseTimeTo(this.afterClosingTime);
    ended = await this.crowdsale.hasClosed();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
     it('should reject payments before start', async function () {
       await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
       await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
     });

     it('should be token owner', async function () {
        await increaseTimeTo(this.openingTime);
        const owner = await this.token.owner();
        owner.should.equal(this.crowdsale.address);
     });

     it('should assign tokens to sender properly', async function (){
        await increaseTimeTo(this.openingTime + 10);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(12000));
     });

     it('should accept payments', async function () {
        await increaseTimeTo(this.openingTime);
        const owner = await this.token.owner();
        owner.should.equal(this.crowdsale.address);
        await this.crowdsale.send(value).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
     });

     it('should change PurchaseRate at PreSale', async function(){
        await increaseTimeTo(this.preSalePeriod - 10);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(12000));
     });
     it('should change PurchaseRate at Week1', async function(){
        await increaseTimeTo(this.week1Period - 10);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(11500));
     });
     it('should change PurchaseRate at Week2', async function(){
        await increaseTimeTo(this.week2Period - 10);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(11000));
     });
     it('should change PurchaseRate at Week3', async function(){
        await increaseTimeTo(this.week3Period - 10);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(10500));
     });
     it('should change PurchaseRate at Week4(LastWeek)', async function(){
        await increaseTimeTo(this.closingTime - 10);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value.mul(10000));
     });
   });

     it('should reject payments after end', async function () {
       await increaseTimeTo(this.afterClosingTime);
       await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
       await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
   });
  describe('Checking RefundableCrowdsale', function (){
     it('should deny refunds before end', async function () {
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
     });
     it('should deny refunds after end if goal was reached', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.sendTransaction({ value: goal, from: investor });
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
     });
     it('should allow refunds after end if goal was not reached', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: owner });
        const pre = web3.eth.getBalance(investor);
        await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
        .should.be.fulfilled;
        const post = web3.eth.getBalance(investor);
        post.minus(pre).should.be.bignumber.equal(lessThanGoal);
     });
     it('should forward funds to wallet after end if goal was reached', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.sendTransaction({ value: goal, from: investor });
        await increaseTimeTo(this.afterClosingTime);
        const pre = web3.eth.getBalance(wallet);
        await this.crowdsale.finalize({ from: owner });
        const post = web3.eth.getBalance(wallet);
        post.minus(pre).should.be.bignumber.equal(goal);
     });
  });
  describe('Checking finalization', function (){
      it('cannot be finalized before ending', async function () {
         await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
      });

      it('cannot be finalized by third party after ending', async function () {
          await increaseTimeTo(this.afterClosingTime);
          await this.crowdsale.finalize({ from: thirdparty }).should.be.rejectedWith(EVMRevert);
       });

      it('can be finalized by owner after ending', async function () {
         await increaseTimeTo(this.afterClosingTime);
         await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
      });

      it('should forward funds to wallet after closing', async function () {
          await this.vault.deposit(investor, { value, from: owner });
          const pre = web3.eth.getBalance(wallet);
          await this.vault.close({ from: owner });
          const post = web3.eth.getBalance(wallet);
          post.minus(pre).should.be.bignumber.equal(value);
      });
      it('cannot be finalized twice', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: owner });
        await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
      });
  });

  describe('Checking Cap', function () {
      it('should accept payments within cap', async function () {
        await increaseTimeTo(this.openingTime + 10);
        await this.crowdsale.sendTransaction({ value: cap.minus(1), from: investor }).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {
        await increaseTimeTo(this.openingTime + 10);
        await this.crowdsale.sendTransaction({ value: cap.plus(1), from: investor }).should.be.rejectedWith(EVMRevert);
      });

      it('should reject a additional payments exceeds cap', async function () {
        await increaseTimeTo(this.preSalePeriod - 10);
        await this.crowdsale.sendTransaction({ value: ether(14.98), from: investor }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: ether(0.21), from: investor }).should.be.rejectedWith(EVMRevert);
      });
      it('should not reach cap when someone send ether within cap', async function(){
        await increaseTimeTo(this.preSalePeriod - 10);
        await this.crowdsale.sendTransaction({ value: ether(10), from: investor});
        let capReached = await this.crowdsale.capReached();
        capReached.should.be.equal(false);
      });
      it('should reach cap if cap sent', async function() {
        await increaseTimeTo(this.preSalePeriod);
        await this.crowdsale.sendTransaction({value: ether(15), from:investor});
        let capReached = await this.crowdsale.capReached();
        capReached.should.be.equal(true);
      });
  });
  describe('Checking function of Allocation', function (){
      it('should not be triggered before closingTime', async function(){
        await increaseTimeTo(this.openingTime + 10);
        await this.crowdsale.MintForAlloc(owner, owner,{from: owner}).should.be.rejectedWith(EVMRevert);
      });
      it('should be triggered by owner after closingTime', async function (){
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.MintForAlloc(owner,owner,{from:owner}).should.be.fulfilled;
      });
      it('should not be triggered by thirdparty', async function(){
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.MintForAlloc(owner,owner,{from: investor}).should.be.rejectedWith(EVMRevert);
      });
  });

});
