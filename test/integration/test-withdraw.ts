import chai from "chai"
import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerV2Instance,
  VaultInstance,
  StrategyTestV2Instance,
} from "../../types"
import { eq } from "../util"
import _setup from "./setup"

contract("integration - withdraw", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let vault: VaultInstance
  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest
    await controller.invest(vault.address, { from: admin })
  })

  const snapshot = async () => {
    return {
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
      vault: {
        balanceInStrategy: await vault.balanceInStrategy(),
      },
    }
  }

  it("should withdraw", async () => {
    const amount = await strategy.totalAssets()
    const min = amount

    const before = await snapshot()
    await controller.withdraw(strategy.address, amount, min, { from: admin })
    const after = await snapshot()

    // check strategy transferred underlying token back to vault
    assert(eq(after.underlying.vault, before.underlying.vault.add(amount)), "vault")
  })

  it("should reject if transferred amount < min", async () => {
    const amount = await strategy.totalAssets()
    const min = amount.add(new BN(1))

    await chai
      .expect(controller.withdraw(strategy.address, amount, min, { from: admin }))
      .to.be.rejectedWith("withdraw < min")
  })
})
