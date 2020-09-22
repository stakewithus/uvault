// https://github.com/indutny/bn.js/
const BN = require("bn.js");

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

module.exports = {
  eq,
  add,
  sub,
  frac,
  USDC_TO_CUSD_DECIMALS,
};
