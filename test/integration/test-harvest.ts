import {
  ControllerInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../types"
import _setup from "./setup"

contract("integration - harvest", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  before(async () => {
    controller = refs.controller
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth
  })

  describe("erc20", () => {
    it("should harvest", async () => {
      await controller.harvest(strategyErc20.address, { from: admin })
    })
  })

  describe("eth", () => {
    it("should harvest", async () => {
      await controller.harvest(strategyEth.address, { from: admin })
    })
  })
})
