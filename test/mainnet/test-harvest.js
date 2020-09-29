const BN = require("bn.js")
const {eq, add} = require("../util")
const {encodeHarvest} = require("./lib")
const setup = require("./setup")
const {assert} = require("chai")

contract("integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let gasRelayer
  let gasToken
  let controller
  let vault
  let strategy
  let underlying
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying
  })

  it("should harvest", async () => {
    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeHarvest(web3, strategy.address)

    await gasRelayer.relayTx(gasTokenBal, controller.address, txData)

    assert(await strategy._harvestWasCalled_(), "harvest")
  })
})
