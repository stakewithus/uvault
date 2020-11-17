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
  const { admin, vault, treasury, whale } = refs

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

    // harvest to create some profit
    await strategy.harvest({ from: admin })
  })

  it("should skim", async () => {
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
    await strategy.skim()
    const after = await snapshot()

    assert(after.underlying.vault.gte(before.underlying.vault), "underlying vault")

    if (before.strategy.totalAssets.gte(before.strategy.totalDebt)) {
      assert(
        after.strategy.totalAssets.lte(before.strategy.totalAssets),
        "total assets"
      )
    }

    assert(after.strategy.totalDebt.lte(before.strategy.totalDebt), "total debt")
  })
})
