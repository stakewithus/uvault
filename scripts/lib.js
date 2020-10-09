const assert = require("assert")

function getAddress(config, network, name) {
  const addr = config[network][name]
  assert(addr, `${network}.${name} is undefined`)

  return addr
}

async function getAccountAddress(ethers) {
  const [account] = await ethers.getSigners()

  const addr = await account.getAddress()
  console.log("Account:", addr)
  console.log("Balance:", (await account.getBalance()).toString())

  return addr
}

module.exports = {
  getAddress,
  getAccountAddress,
}
