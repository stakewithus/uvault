import BN from "bn.js"
import { Ierc20Instance } from "../../../types/Ierc20"
import { ControllerInstance } from "../../../types/Controller"
import { GaugeInstance } from "../../../types/Gauge"
import { StrategyInstance } from "./lib"
import { pow } from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const {admin, vault, treasury, whale} = refs

    let underlying: Ierc20Instance
    let cUnderlying: Ierc20Instance
    let gauge: GaugeInstance
    let crv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      cUnderlying = refs.cUnderlying
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, {from: vault})
      await strategy.deposit(depositAmount, {from: vault})
    })

    it("should harvest", async () => {
      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        gauge,
        crv,
        strategy,
        treasury,
        vault,
      })

      const before = await snapshot()
      await controller.harvest(strategy.address, {from: admin})
      const after = await snapshot()

      assert(after.underlying.treasury.gte(before.underlying.treasury), "underlying treasury")
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets),
        "strategy underlying balance"
      )
      assert(after.gauge.strategy.gte(before.gauge.strategy), "gauge strategy")
      assert(after.crv.strategy.gte(before.crv.strategy), "crv strategy")
    })
  })
}