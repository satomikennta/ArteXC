import lkTestHelpers from 'lk-test-helpers/src/main.js'
const {
  advanceBlock,
  advanceToBlock,
  assertJump,
  ether,
  latestTime,
  increaseTime,
  increaseTimeTo,
  EVMThrow,
  EVMRevert,
  expectThrow,
  hashMessage,
  timer,
  toPromise,
  transactionMined
} = lkTestHelpers(web3)

const BigNumber = web3.BigNumber;
var AXCToken = artifacts.require('./AXCToken.sol')
var AXCCrowdsale = artifacts.require('./AXCCrowdsale.sol')

contract('AXCCrowdsale', function ([owner, wallet, investor]) {
  const RATE = new BigNumber(10);
  const GOAL = ether(10);
  const CAP = ether(20);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + 1;
    this.closingTime = this.openingTime + 100;
    this.afterClosingTime = this.closingTime + 1;

    this.token = await AXCToken.new({ from: owner });
    this.crowdsale = await AXCCrowdsale.new(
      this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, GOAL
    );
    await this.token.transferOwnership(this.crowdsale.address);
  });

  it('should create crowdsale with correct parameters', async function () {
    this.crowdsale.should.exist;
    this.token.should.exist;

    const openingTime = await this.crowdsale.openingTime();
    const closingTime = await this.crowdsale.closingTime();
    const rate = await this.crowdsale.rate();
    const walletAddress = await this.crowdsale.wallet();
    const goal = await this.crowdsale.goal();
    const cap = await this.crowdsale.cap();

    openingTime.should.be.bignumber.equal(this.openingTime);
    closingTime.should.be.bignumber.equal(this.closingTime);
    rate.should.be.bignumber.equal(RATE);
    walletAddress.should.be.equal(wallet);
    goal.should.be.bignumber.equal(GOAL);
    cap.should.be.bignumber.equal(CAP);
  });
});

contract('AXCToken', function(accounts){
  it('should 0 Token in first status', function(){
    return AXCToken.deployed().then(function(instance){
      return instance.balanceOf(accounts[0]);
    }).then(function(balance){
      assert.equal(balance.valueOf(), 0, "initial token value is not 0. something wrong in initialization of Token");
    });
  });

  const purchaser = web3.eth.accounts[2];
  var AXCInstance;
  var crowdsale;
  const rate=1000; // it is set at deploy in 2_deploy_XXX.js

  it('crowdsale started', function(){
    return AXCCrowdsale.deployed().then(function(instance){
      crowdsale = instance;
      return crowdsale.token();
    }).then(function(tokenAddress){
      AXCInstance = AXCToken.at(tokenAddress);
      AXCInstance.transferOwnership(crowdsale.address);
      sleep(1000); // wait until crowdsale starts
    }).then(function(){
      return AXCInstance.balanceOf(purchaser);
    }).then(function(balance){
      assert.equal(balance.toString(10), "0", "token value at crowdsale is not 0. something wrong in initialization of crowdsale");
    });
  });

  it('send token', function(){
    crowdsale.sendTransaction({ from: purchaser, value: web3.toWei(5, "ether")});
    return AXCInstance.balanceOf(purchaser).then(function(balance){
      const purchaserGusTokenBalance = balance.toString(10);
      assert.equal(web3.fromWei(purchaserGusTokenBalance, "ether"), "5000", "sended token value is wrong. check token rate");
    });
  });

  //lockup
  //finish : cannnot send eth to crowdsale

  //goal
  //refund
  //cap
  //burn

});

function sleep(time) {
    const d1 = new Date();
    while (true) {
        const d2 = new Date();
        if (d2 - d1 > time) {
            return;
        }
    }
}
