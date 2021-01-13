import BN from "bn.js"
import { StrategyAaveDaiInstance } from "../../../types"
import { IERC20Instance, ControllerInstance, GaugeInstance } from "../../../types"
import { pow, MAX_UINT } from "../../util"
import { DAI_DECIMALS } from "../../util"
import { getSnapshot } from "../StrategyCurve/lib"
import _setup from "./setup"

contract("StrategyAaveDai", (accounts) => {
  const DECIMALS = DAI_DECIMALS
  const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

  const refs = _setup(accounts)
  const { admin, vault, treasury, whale } = refs

  let underlying: IERC20Instance
  let lp: IERC20Instance
  let gauge: GaugeInstance
  let crv: IERC20Instance
  let controller: ControllerInstance
  let strategy: StrategyAaveDaiInstance
  beforeEach(async () => {
    underlying = refs.underlying
    lp = refs.lp
    gauge = refs.gauge
    crv = refs.crv
    controller = refs.controller
    // TODO fix ts-ignore
    // @ts-ignore
    strategy = refs.strategy

    // deposit underlying into vault
    await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

    // deposit underlying into strategy
    await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })
    await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
  })

  it("should harvest", async () => {
    const min = 0
    const max = MAX_UINT

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
    await strategy.harvest2(min, max, { from: admin })
    const after = await snapshot()

    assert(
      after.underlying.treasury.gte(before.underlying.treasury),
      "underlying treasury"
    )
    assert(
      after.strategy.totalAssets.gt(before.strategy.totalAssets),
      "strategy total assets"
    )
    assert(after.gauge.strategy.gt(before.gauge.strategy), "gauge strategy")
    // Check CRV was liquidated
    assert(after.crv.strategy.eq(new BN(0)), "crv strategy")
  })
})
