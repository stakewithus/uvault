const ERC20Token = artifacts.require("ERC20Token")
const Controller = artifacts.require("Controller")
const StrategyTest = artifacts.require("StrategyTest")
const MockVault = artifacts.require("MockVault")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  // mock contract addresses
  const gasRelayer = accounts[2]

  // references to return
  const refs = {
    admin,
    treasury,
    underlying: null,
    gasRelayer,
    controller: null,
    vault: null,
    strategy: null,
  }

  beforeEach(async () => {
    refs.underlying = await ERC20Token.new()
    refs.controller = await Controller.new(treasury, gasRelayer, {
      from: admin,
    })
    refs.vault = await MockVault.new(refs.controller.address, refs.underlying.address)
    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )

    // fund strategy
    await refs.underlying.mint(refs.strategy.address, 1000)
  })

  return refs
}
