import BN from "bn.js"
import {IERC20Instance} from "../../../types/IERC20"
import {ControllerInstance} from "../../../types/Controller"
import {MasterChefInstance} from "../../../types/MasterChef"
import {StrategyInstance} from "./lib"
import {eq, frac, pow} from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (name: string, _setup: Setup, params: {DECIMALS: BN}) => {
  contract(name, (accounts) => {
    const {DECIMALS} = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const {vault, treasury, whale} = refs

    let underlying: IERC20Instance
    let jar: IERC20Instance
    let chef: MasterChefInstance
    let pickle: IERC20Instance
    let threeCrv: IERC20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      jar = refs.jar
      chef = refs.chef
      pickle = refs.pickle
      threeCrv = refs.threeCrv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, {from: vault})
      await strategy.deposit(depositAmount, {from: vault})
    })

    it("should withdraw", async () => {
      const snapshot = getSnapshot({
        underlying,
        jar,
        chef,
        pickle,
        threeCrv,
        strategy,
        treasury,
        vault,
      })

      // withdraw amount may be < deposit amount
      // so here we get the maximum redeemable amount
      const withdrawAmount = await strategy.totalAssets()

      const before = await snapshot()
      await strategy.withdraw(withdrawAmount, {from: vault})
      const after = await snapshot()

      // unstake p3crv from MasterChef
      assert(after.jar.chef.lt(before.jar.chef), "jar chef")

      // transfer underlying to vault //
      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)

      // check balance of underlying transferred to vault
      assert(
        after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
        "underlying vault"
      )
      assert(
        after.strategy.totalDebt.lte(before.strategy.totalDebt.sub(minUnderlying)),
        "total debt"
      )
      // check strategy does not have any underlying
      assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
      // check strategy dust is small
      assert(after.threeCrv.strategy.lte(new BN(100)), "jar strategy")
      // check Pickle was minted
      assert(after.pickle.strategy.gt(before.pickle.strategy), "pickle strategy")
    })
  })
}
