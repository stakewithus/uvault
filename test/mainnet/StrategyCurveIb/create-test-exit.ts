import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow, frac } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(100))
    const CRV_DUST = pow(10, 18)

    const refs = _setup(accounts)
    const { vault, whale } = refs

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

    it("should exit", async () => {
      const snapshot = getSnapshot(refs)

      const before = await snapshot()
      await strategy.exit({ from: vault })
      const after = await snapshot()

      // minimum amount of underlying that must be withdrawn
      const minUnderlying = frac(before.strategy.totalAssets, 99, 100)

      assert(after.gauge.strategy.eq(new BN(0)), "gauge strategy")
      // check strategy dust is small
      assert(after.lp.strategy.lte(new BN(100)), "lp strategy")
      assert(after.underlying.strategy.eq(new BN(0)), "underlying strategy")
      assert(after.crv.strategy.lte(CRV_DUST), "crv strategy")
      assert(after.strategy.totalDebt.lte(new BN(0)), "total debt")
      assert(
        after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
        "underlying vault"
      )
    })
  })
}
