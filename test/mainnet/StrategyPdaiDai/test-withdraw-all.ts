import BN from "bn.js"
import {
  IERC20Instance,
  ControllerInstance,
  MasterChefInstance,
  StrategyPdaiDaiInstance,
  PickleStakingInstance,
} from "../../../types"
import { eq, pow, frac } from "../../util"
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

  it("should withdraw all", async () => {
    const snapshot = getSnapshot({
      underlying,
      jar,
      chef,
      pickle,
      staking,
      strategy,
      treasury,
      vault,
    })

    const before = await snapshot()
    await strategy.withdrawAll({ from: vault })
    const after = await snapshot()

    // minimum amount of underlying that can be withdrawn
    const minUnderlying = frac(before.strategy.totalAssets, 99, 100)

    // check balance of underlying transferred to vault
    assert(
      after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
      "underlying vault"
    )
    // check total debt
    assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
    // check strategy does not have any underlying
    assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
    // check jar balance of strategy
    assert(eq(after.jar.strategy, new BN(0)), "jar strategy")
    // check Pickle was minted
    assert(after.pickle.strategy.gt(before.pickle.strategy), "pickle strategy")
    // check staked amount in MasterChef
    assert(after.chef.staked.eq(new BN(0)), "chef")
  })
})
