import BN from "bn.js"
import {
  IERC20Instance,
  ControllerInstance,
  MasterChefInstance,
  StrategyPdaiDaiInstance,
  PickleStakingInstance,
} from "../../../types"
import { eq, pow } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyPdaiDai", (accounts) => {
  // DAI decimals
  const DECIMALS = 18
  const depositAmount = pow(10, DECIMALS).mul(new BN(1000000))

  const refs = _setup(accounts)
  const { vault, treasury, whale } = refs

  let underlying: IERC20Instance
  let jar: IERC20Instance
  let chef: MasterChefInstance
  let pickle: IERC20Instance
  let staking: PickleStakingInstance
  let controller: ControllerInstance
  let strategy: StrategyPdaiDaiInstance
  beforeEach(async () => {
    underlying = refs.underlying
    jar = refs.jar
    chef = refs.chef
    pickle = refs.pickle
    staking = refs.staking
    controller = refs.controller
    strategy = refs.strategy

    // deposit underlying into vault
    await underlying.transfer(vault, depositAmount, { from: whale })

    // deposit underlying into strategy
    await underlying.approve(strategy.address, depositAmount, { from: vault })
    await strategy.deposit(depositAmount, { from: vault })
  })

  it("should exit", async () => {
    const snapshot = getSnapshot({
      underlying,
      jar,
      chef,
      pickle,
      staking,
      strategy,
      vault,
      treasury,
    })

    const before = await snapshot()
    await strategy.exit({ from: vault })
    const after = await snapshot()

    // withdraw
    assert(eq(after.strategy.totalAssets, new BN(0)), "strategy total assets")
    assert(eq(after.jar.strategy, new BN(0)), "jar strategy")
    // Pickle was liquidated
    assert(eq(after.pickle.strategy, new BN(0)), "pickle strategy")
    // check underlying transfer
    assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
    assert(after.underlying.vault.gt(before.underlying.vault), "underlying vault")
    // unstake from MasterChef
    assert(after.chef.staked.eq(new BN(0)), "chef")
    // Check staking reward was claimed
    assert(after.staking.strategy.eq(new BN(0)), "staking - strategy")
    assert(after.staking.earned.eq(new BN(0)), "staking - earned")
  })
})
