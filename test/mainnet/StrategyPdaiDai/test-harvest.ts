import BN from "bn.js"
import {
  IERC20Instance,
  ControllerInstance,
  MasterChefInstance,
  StrategyPdaiDaiInstance,
} from "../../../types"
import { eq, pow } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyPdaiDai", (accounts) => {
  // DAI decimals
  const DECIMALS = 18
  const depositAmount = pow(10, DECIMALS).mul(new BN(1000000))

  const refs = _setup(accounts)
  const { admin, vault, treasury, whale } = refs

  let underlying: IERC20Instance
  let jar: IERC20Instance
  let chef: MasterChefInstance
  let pickle: IERC20Instance
  let controller: ControllerInstance
  let strategy: StrategyPdaiDaiInstance
  beforeEach(async () => {
    underlying = refs.underlying
    jar = refs.jar
    chef = refs.chef
    pickle = refs.pickle
    controller = refs.controller
    strategy = refs.strategy

    // deposit underlying into vault
    await underlying.transfer(vault, depositAmount, { from: whale })

    // deposit underlying into strategy
    await underlying.approve(strategy.address, depositAmount, { from: vault })
    await strategy.deposit(depositAmount, { from: vault })

    // withdraw to claim Pickles
    await strategy.withdrawAll({ from: vault })
  })

  it("should harvest", async () => {
    const snapshot = getSnapshot({
      underlying,
      jar,
      chef,
      pickle,
      strategy,
      treasury,
      vault,
    })

    const before = await snapshot()
    await strategy.harvest({ from: admin })
    const after = await snapshot()

    // Check fee transfer
    assert(
      after.underlying.treasury.gte(before.underlying.treasury),
      "underlying treasury"
    )
    // Check strategy total assets
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets),
      "strategy total assets"
    )
    // Check Pickle was liquidated
    assert(eq(after.pickle.strategy, new BN(0)), "pickle strategy")
    // Check DAI earned from selling Pickle were staked
    assert(after.chef.staked.gte(before.chef.staked), "chef strategy")
  })
})
