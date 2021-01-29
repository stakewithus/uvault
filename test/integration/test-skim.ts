import {
  TestTokenInstance,
  ControllerInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../types"
import _setup from "./setup"

contract("integration - skim", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let underlying: TestTokenInstance
  let controller: ControllerInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  beforeEach(async () => {
    underlying = refs.underlying
    controller = refs.controller
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth

    // force total underlying to be > debt
    await underlying._mint_(strategyErc20.address, 100)
    await strategyEth.sendTransaction({ from: admin, value: 100 })
  })

  describe("erc20", () => {
    it("should skim", async () => {
      await controller.skim(strategyErc20.address, { from: admin })
    })
  })

  describe("eth", () => {
    it("should skim", async () => {
      await controller.skim(strategyEth.address, { from: admin })
    })
  })
})
