const BN = require("bn.js")
const {eq, add} = require("../util")
const {encodeInvest, encodeWithdrawAll} = require("./lib")
const setup = require("./setup")

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

    // invest
    const txData = encodeInvest(web3, vault.address)
    await gasRelayer.relayTx(0, controller.address, txData, {
      from: admin,
    })
  })

  it("should withdraw all", async () => {
    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
      }
    }

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeWithdrawAll(web3, strategy.address)

    const before = await snapshot()
    await gasRelayer.relayTx(gasTokenBal, controller.address, txData)
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
  })
})
