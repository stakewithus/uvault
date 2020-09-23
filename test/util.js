// https://github.com/indutny/bn.js/
const BN = require("bn.js");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const MAX_UINT = new BN(2).pow(new BN(256)).sub(new BN(1));

// NOTE: x, y BN.js instance
function eq(x, y) {
  return x.eq(y);
}

// NOTE: x, y BN.js instance
function add(x, y) {
  return x.add(y);
}

// NOTE: x, y BN.js instance
function sub(x, y) {
  return x.sub(y);
}

// NOTE: x, n, d BN.js instance
function frac(x, n, d) {
  return x.mul(n).div(d);
}

const USDC_TO_CUSD_DECIMALS = new BN(10).pow(new BN(12));

function sendEther(web3, from, to, amount) {
  return web3.eth.sendTransaction({
    from,
    to,
    value: web3.utils.toWei(amount.toString(), "ether"),
  });
}

async function getBlockTimestamp(web3, tx) {
  const block = await web3.eth.getBlock(tx.receipt.blockHash);
  return block.timestamp;
}

async function timeout(secs) {
  return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}

module.exports = {
  ZERO_ADDRESS,
  MAX_UINT,
  eq,
  add,
  sub,
  frac,
  USDC_TO_CUSD_DECIMALS,
  sendEther,
  getBlockTimestamp,
  timeout,
};
