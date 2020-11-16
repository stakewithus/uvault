import BN from "bn.js"
import { IERC20Instance, ControllerInstance, MasterChefInstance } from "../../../types"
import { pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, treasury, whale } = refs

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
      await underlying.transfer(vault, depositAmount, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, { from: vault })
      await strategy.deposit(depositAmount, { from: vault })

      // withdraw to claim Pickles
      await strategy.withdrawAll({ from: vault })
      // harvest to create some profit
      await strategy.harvest({ from: admin })
    })

    it("should skim", async () => {
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

      const before = await snapshot()
      await strategy.skim()
      const after = await snapshot()

      assert(after.underlying.vault.gte(before.underlying.vault), "underlying vault")
      assert(
        after.strategy.totalAssets.lte(before.strategy.totalAssets),
        "total assets"
      )
      assert(after.strategy.totalDebt.lte(before.strategy.totalDebt), "total debt")
    })
  })
}
