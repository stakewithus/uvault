import BN from "bn.js"
import {Ierc20Instance} from "../../../types/Ierc20"
import {ControllerInstance} from "../../../types/Controller"
import {MasterChefInstance} from "../../../types/MasterChef"
import {StrategyInstance} from "./lib"
import {eq, sub, frac, pow, add} from "../../util"
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
    let jar: Ierc20Instance
    let chef: MasterChefInstance
    let pickle: Ierc20Instance
    let threeCrv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(() => {
      underlying = refs.underlying
      jar = refs.jar
      chef = refs.chef
      pickle = refs.pickle
      threeCrv = refs.threeCrv
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
        jar,
        chef,
        pickle,
        threeCrv,
        strategy,
        vault,
        treasury,
      })

      const before = await snapshot()
      await strategy.deposit(depositAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)

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
      // check 3Crv was deposited into Pickle jar
      assert(after.threeCrv.jar.gt(before.threeCrv.jar), "3Crv jar")
      // check p3Crv was staked into MasterChef
      assert(after.jar.chef.gt(before.jar.chef), "p3crv")
    })
  })
}
