var AXCToken = artifacts.require('./AXCToken.sol')
var AXCCrowdsale = artifacts.require('./AXCCrowdsale.sol')
const duration = {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)}
};

const promisefy = (fn, ...args) => new Promise((accept, reject) => fn(...args, (err, res) => err ? reject(err) : accept(res)))

module.exports = function(deployer, network, accounts) {
  //const timestamp = (await promisefy(web3.eth.getBlock, 'latest')).timestamp
  const rate = new web3.BigNumber(12000); // trade rate from ETH
  const goal = web3.toWei(6, 'ether');
  const cap = web3.toWei(7, 'ether');
  const tokencap = web3.toWei(10000000 , 'ether');
  const wallet = accounts[0];

  return deployer
        .then(async () => {
            return deployer.deploy(
              AXCToken,
              tokencap,{gas:2000000}
            );
        })
        .then(async () => {
          const timestamp = (await promisefy(web3.eth.getBlock, 'latest')).timestamp;
          const openingTime = timestamp + duration.minutes(3);
          // const openingTime = timestamp + 120;
          const closingTime = openingTime + duration.minutes(20);
          return deployer.deploy(
              AXCCrowdsale,
              openingTime,
              closingTime,
              rate,
              goal,
              wallet,
              cap,
              AXCToken.address,{gas: 2000000}
          );
        }).then(async () => {
          const token = AXCToken.at(AXCToken.address);
          token.transferOwnership(AXCCrowdsale.address);
        });

};
