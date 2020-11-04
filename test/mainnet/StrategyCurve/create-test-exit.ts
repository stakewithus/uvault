import BN from "bn.js"
import { Ierc20Instance } from "../../../types/Ierc20"
import { ControllerInstance } from "../../../types/Controller"
import { GaugeInstance } from "../../../types/Gauge"
import { StrategyInstance } from "./lib"
import { eq, pow } from "../../util"
import { Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const { vault, treasury, whale } = refs

    let underlying: Ierc20Instance
    let lp: Ierc20Instance
    let gauge: GaugeInstance
    let crv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      lp = refs.lp
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, depositAmount, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, { from: vault })
      await strategy.deposit(depositAmount, { from: vault })
    })

    it("should exit", async () => {
      const snapshot = getSnapshot({
        underlying,
        lp,
        gauge,
        crv,
        strategy,
        treasury,
        vault,
      })

      const before = await snapshot()
      await strategy.exit({ from: vault })
      const after = await snapshot()

      assert(eq(after.gauge.strategy, new BN(0)), "gauge strategy")
      // check strategy dust is small
      assert(after.lp.strategy.lte(new BN(100)), "lp strategy")
      assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
      assert(eq(after.crv.strategy, new BN(0)), "crv strategy")
      assert(after.underlying.vault.gte(before.underlying.vault), "underlying vault")
    })
  })
}
