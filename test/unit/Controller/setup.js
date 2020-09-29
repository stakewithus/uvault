const Controller = artifacts.require("Controller")
const MockStrategy = artifacts.require("MockStrategy")
const MockVault = artifacts.require("MockVault")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  // mock contract addresses
  const gasRelayer = accounts[2]
  const underlyingToken = accounts[3]

  // references to return
  const refs = {
    admin,
    treasury,
    underlyingToken,
    gasRelayer,
    controller: null,
    vault: null,
    strategy: null,
  }

  beforeEach(async () => {
    refs.controller = await Controller.new(treasury, gasRelayer, {
      from: admin,
    })
    refs.vault = await MockVault.new(refs.controller.address, underlyingToken)
    refs.strategy = await MockStrategy.new(
      refs.controller.address,
      refs.vault.address,
      underlyingToken
    )
  })

  return refs
}
