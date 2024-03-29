import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, whale } = refs

    let underlying: IERC20Instance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
    })

    it("should harvest", async () => {
      const snapshot = getSnapshot(refs)

      const before = await snapshot()
      await strategy.harvest({ from: admin })
      const after = await snapshot()

      assert(
        after.underlying.treasury.gt(before.underlying.treasury),
        "underlying treasury"
      )
      assert(
        after.underlying.strategy.gte(before.underlying.strategy),
        "underlying strategy"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets),
        "strategy total assets"
      )
    })
  })
}
