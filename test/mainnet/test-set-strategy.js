const BN = require("bn.js")
const {eq, add} = require("../util")
const {encodeInvest, encodeSetStrategy} = require("./lib")
const setup = require("./setup")
const {assert} = require("chai")

const StrategyTest = artifacts.require("StrategyTest")

contract("mainnet integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let gasRelayer
  let gasToken
  let controller
  let vault
  let strategy
  let underlying
  let newStrategy
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest
    const txData = encodeInvest(web3, vault.address)
    await gasRelayer.relayTx(controller.address, txData, 0, {
      from: admin,
    })

    // new stratgy
    newStrategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address,
      {
        from: admin,
      }
    )
  })

  it("should set strategy", async () => {
    const snapshot = async () => {
      return {
        vault: {
          strategy: await vault.strategy(),
        },
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
      }
    }

    // set next strategy
    await vault.setNextStrategy(newStrategy.address, {from: admin})

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeSetStrategy(web3, vault.address, newStrategy.address)

    const before = await snapshot()
    await gasRelayer.relayTx(controller.address, txData, gasTokenBal)
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      eq(
        after.underlying.vault,
        add(before.underlying.vault, before.underlying.strategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
    // check vault.strategy
    assert.equal(after.vault.strategy, newStrategy.address, "new strategy")
  })
})
