const assert = require("assert")

function getAddress(config, network, name) {
  const addr = config[network][name]
  assert(addr, `${network}.${name} is undefined`)

  return addr
}

module.exports = {
  getAddress,
}
