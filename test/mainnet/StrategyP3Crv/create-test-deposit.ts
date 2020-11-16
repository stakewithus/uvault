import BN from "bn.js"
import { IERC20Instance, ControllerInstance, MasterChefInstance } from "../../../types"
import { frac, pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const refs = _setup(accounts)
    const { vault, treasury, whale } = refs

    const { DECIMALS } = params

    let underlying: IERC20Instance
    let jar: IERC20Instance
    let chef: MasterChefInstance
    let pickle: IERC20Instance
    let threeCrv: IERC20Instance
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
      const depositAmount = pow(10, DECIMALS).mul(new BN(1000000))

      // transfer underlying to vault
      await underlying.transfer(vault, depositAmount, { from: whale })

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, depositAmount, { from: vault })

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
      await strategy.deposit(depositAmount, { from: vault })
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)

      // underlying transferred from vault to strategy
      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(depositAmount)),
        "underlying vault"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minUnderlying)),
        "total assets"
      )
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(depositAmount)),
        "total debt"
      )
      // check 3Crv was deposited into Pickle jar
      assert(after.threeCrv.jar.gt(before.threeCrv.jar), "3Crv jar")
      // check p3Crv was staked into MasterChef
      assert(after.jar.chef.gt(before.jar.chef), "p3crv")
      assert(after.chef.staked.gt(before.chef.staked), "chef - strategy")
    })
  })
}
