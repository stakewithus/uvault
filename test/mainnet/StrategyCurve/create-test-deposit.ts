import BN from "bn.js"
import {Ierc20Instance} from "../../../types/Ierc20"
import {ControllerInstance} from "../../../types/Controller"
import {GaugeInstance} from "../../../types/Gauge"
import {StrategyInstance} from "./lib"
import {eq, sub, frac, pow} from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (
  name: string,
  _setup: Setup,
  params: {DECIMALS: BN; UNDERLYING_TO_CURVE_DECIMALS: BN}
) => {
  contract(name, (accounts) => {
    const refs = _setup(accounts)
    const {vault, treasury, whale} = refs

    const {DECIMALS, UNDERLYING_TO_CURVE_DECIMALS} = params

    let underlying: Ierc20Instance
    let cUnderlying: Ierc20Instance
    let gauge: GaugeInstance
    let crv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(() => {
      underlying = refs.underlying
      cUnderlying = refs.cUnderlying
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy
    })

    it("should deposit", async () => {
      const depositAmount = pow(10, DECIMALS)

      // transfer underlying to vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, depositAmount, {from: vault})

      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        gauge,
        crv,
        strategy,
        vault,
        treasury,
      })

      const before = await snapshot()
      await strategy.deposit(depositAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)
      // minimum amount of cUnderlying minted
      const minC = frac(depositAmount.mul(UNDERLYING_TO_CURVE_DECIMALS), 95, 100)

      const gaugeDiff = sub(after.gauge.strategy, before.gauge.strategy)
      const underlyingDiff = sub(
        after.strategy.totalAssets,
        before.strategy.totalAssets
      )

      // underlying transferred from vault to strategy
      assert(
        eq(after.underlying.vault, sub(before.underlying.vault, depositAmount)),
        "underlying vault"
      )
      assert(underlyingDiff.gte(minUnderlying), "min underlying")
      assert(gaugeDiff.gte(minC), "min gauge")
    })
  })
}
