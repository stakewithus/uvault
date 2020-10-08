const ERC20Token = artifacts.require("ERC20Token")
const MockController = artifacts.require("MockController")
const MockVault = artifacts.require("MockVault")
const BaseStrategy = artifacts.require("BaseStrategy")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  const refs = {
    admin,
    treasury,
    erc20: null,
    controller: null,
    vault: null,
  }

  beforeEach(async () => {
    refs.erc20 = await ERC20Token.new()
    refs.controller = await MockController.new(treasury)
    refs.vault = await MockVault.new(refs.controller.address, refs.erc20.address)
    refs.strategy = await BaseStrategy.new(
      refs.controller.address,
      refs.vault.address,
      {from: admin}
    )
  })

  return refs
}
