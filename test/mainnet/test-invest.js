const BN = require("bn.js")
const {eq, sub} = require("../util")
const {encodeInvest} = require("./lib")
const setup = require("./setup")

contract("mainnet integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let gasRelayer
  let gasToken
  let controller
  let vault
  let strategy
  let underlying
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying
  })

  it("should invest", async () => {
    const snapshot = async () => {
      return {
        gasToken: {
          gasRelayer: await gasToken.balanceOf(gasRelayer.address),
        },
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
        vault: {
          availableToInvest: await vault.availableToInvest(),
        },
      }
    }

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeInvest(web3, vault.address)

    const before = await snapshot()
    await gasRelayer.relayTx(controller.address, txData, gasTokenBal, {
      from: admin,
    })
    const after = await snapshot()

    // check gas token was used
    assert(after.gasToken.gasRelayer.lte(before.gasToken.gasRelayer), "gas token")
    // check underlying was transferred from vault to strategy
    assert(before.underlying.vault.gt(new BN(0)), "vault before")
    assert(
      eq(
        after.underlying.vault,
        sub(before.underlying.vault, before.vault.availableToInvest)
      ),
      "vault after"
    )
    assert(eq(after.underlying.strategy, before.vault.availableToInvest), "strategy")
  })
})
