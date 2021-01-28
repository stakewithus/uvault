import chai from "chai"
import BN from "bn.js"
import {
  ControllerInstance,
  StrategyERC20TestInstance,
  MockERC20VaultInstance,
} from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let vault: MockERC20VaultInstance
  let strategy: StrategyERC20TestInstance
  beforeEach(() => {
    controller = refs.controller
    vault = refs.erc20Vault
    strategy = refs.strategyErc20
  })

  describe("setStrategyAndInvest", () => {
    it("should set strategy and invest", async () => {
      const min = new BN(1)
      await controller.setStrategyAndInvest(vault.address, strategy.address, min, {
        from: admin,
      })

      assert.equal(await vault.strategy(), strategy.address, "strategy")
      assert.equal(eq(await vault._strategyMin_(), min), true, "min")
      assert(await vault._investWasCalled_(), "invest")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(
          controller.setStrategyAndInvest(vault.address, strategy.address, new BN(0), {
            from: accounts[1],
          })
        )
        .to.be.rejectedWith("!authorized")
    })
  })
})
