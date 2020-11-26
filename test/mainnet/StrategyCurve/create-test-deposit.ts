import BN from "bn.js"
import { IERC20Instance, ControllerInstance, GaugeInstance } from "../../../types"
import { frac, pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (
  name: string,
  _setup: Setup,
  params: { DECIMALS: BN; UNDERLYING_TO_CURVE_DECIMALS: BN }
) => {
  contract(name, (accounts) => {
    const refs = _setup(accounts)
    const { vault, treasury, whale } = refs

    const { DECIMALS, UNDERLYING_TO_CURVE_DECIMALS } = params

    let underlying: IERC20Instance
    let lp: IERC20Instance
    let gauge: GaugeInstance
    let crv: IERC20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(() => {
      underlying = refs.underlying
      lp = refs.lp
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy
    })

    it("should deposit", async () => {
      const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

      // transfer underlying to vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })

      const snapshot = getSnapshot({
        underlying,
        lp,
        gauge,
        crv,
        strategy,
        vault,
        treasury,
      })

      const before = await snapshot()
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(DEPOSIT_AMOUNT, 99, 100)
      // minimum amount of lp minted
      const minLp = frac(DEPOSIT_AMOUNT.mul(UNDERLYING_TO_CURVE_DECIMALS), 93, 100)

      // underlying transferred from vault to strategy
      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(DEPOSIT_AMOUNT)),
        "underlying vault"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minUnderlying)),
        "total assets"
      )
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(DEPOSIT_AMOUNT)),
        "total debt"
      )
      assert(after.gauge.strategy.gte(before.gauge.strategy.add(minLp)), "min gauge")
    })
  })
}
