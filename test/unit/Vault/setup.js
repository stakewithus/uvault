const ERC20Token = artifacts.require("ERC20Token")
const Vault = artifacts.require("Vault")
const MockController = artifacts.require("MockController")
const StrategyTest = artifacts.require("StrategyTest")

module.exports = (accounts, minWaitTime = 0) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  const refs = {
    erc20: null,
    vault: null,
    admin,
    treasury,
    controller: null,
    strategy: null,
  }

  before(async () => {
    refs.erc20 = await ERC20Token.new()
  })

  beforeEach(async () => {
    refs.controller = await MockController.new(treasury)
    refs.vault = await Vault.new(
      refs.controller.address,
      refs.erc20.address,
      minWaitTime
    )

    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.erc20.address,
      {from: admin}
    )
  })

  return refs
}
