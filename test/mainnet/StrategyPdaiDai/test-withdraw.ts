import BN from "bn.js"
import {
  IERC20Instance,
  ControllerInstance,
  MasterChefInstance,
  StrategyPdaiDaiInstance,
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
  })

  it("should withdraw", async () => {
    const snapshot = getSnapshot({
      underlying,
      jar,
      chef,
      pickle,
      strategy,
      treasury,
      vault,
    })

    const withdrawAmount = frac(await strategy.totalAssets(), 50, 100)

    const before = await snapshot()
    await strategy.withdraw(withdrawAmount, { from: vault })
    const after = await snapshot()

    // transfer underlying to vault //
    // minimum amount of underlying that can be withdrawn
    const minUnderlying = frac(withdrawAmount, 99, 100)

    // check balance of underlying transferred to vault
    assert(
      after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
      "underlying vault"
    )
    assert(
      after.strategy.totalDebt.lte(before.strategy.totalDebt.sub(minUnderlying)),
      "total debt"
    )
    assert(
      after.strategy.totalAssets.lte(before.strategy.totalAssets.sub(minUnderlying)),
      "total assets"
    )
    assert(after.chef.staked.lt(before.chef.staked), "chef")
  })
})
