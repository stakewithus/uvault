import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(100))

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
      const tx = await strategy.harvest({ from: admin })
      const after = await snapshot()

      // for (const log of tx.logs) {
      //   // @ts-ignore
      //   console.log(`${log.args.message} ${log.args.val}`)
      // }

      const CRV_DUST = pow(10, 18)

      assert(
        after.underlying.treasury.gte(before.underlying.treasury),
        "underlying treasury"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets),
        "strategy total assets"
      )
      assert(after.gauge.strategy.gte(before.gauge.strategy), "gauge strategy")
      // Check CRV was liquidated
      assert(after.crv.strategy.lte(CRV_DUST), "crv strategy")
    })
  })
}
