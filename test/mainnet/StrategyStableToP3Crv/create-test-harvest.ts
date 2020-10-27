import BN from "bn.js"
import {Ierc20Instance} from "../../../types/Ierc20"
import {ControllerInstance} from "../../../types/Controller"
import {MasterChefInstance} from "../../../types/MasterChef"
import {StrategyInstance} from "./lib"
import {eq, pow} from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (name: string, _setup: Setup, params: {DECIMALS: BN}) => {
  contract(name, (accounts) => {
    const {DECIMALS} = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const {admin, vault, treasury, whale} = refs

    let underlying: Ierc20Instance
    let jar: Ierc20Instance
    let chef: MasterChefInstance
    let pickle: Ierc20Instance
    let threeCrv: Ierc20Instance
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

    it("should harvest", async () => {
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
      // withdraw to claim Pickles
      await strategy.withdrawAll({from: vault})
      // await controller.harvest(strategy.address, {from: admin})
      const after = await snapshot()

      console.log(before.pickle.strategy.toString(), after.pickle.strategy.toString())

      // // Check fee transfer
      // assert(
      //   after.underlying.treasury.gte(before.underlying.treasury),
      //   "underlying treasury"
      // )
      // // Check vault balance after withdraw
      // assert(after.underlying.vault.gt(before.underlying.vault), "underlying vault")
      // // Check strategy total assets > 0 from withdrawing and then selling Pickle
      // assert(after.strategy.totalAssets.gte(new BN(0)), "underlying strategy")
      // // Check Pickle was liquidated
      // assert(eq(after.pickle.strategy, new BN(0)), "pickle strategy")
    })
  })
}
