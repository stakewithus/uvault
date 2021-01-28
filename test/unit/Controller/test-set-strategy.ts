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

  describe("setStrategy", () => {
    it("should set strategy", async () => {
      const min = new BN(1)
      await controller.setStrategy(vault.address, strategy.address, min, {
        from: admin,
      })

      assert.equal(await vault.strategy(), strategy.address, "strategy")
      assert.equal(eq(await vault._strategyMin_(), min), true, "min")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(
          controller.setStrategy(vault.address, strategy.address, new BN(0), {
            from: accounts[1],
          })
        )
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if vault does not exist", async () => {
      await chai.expect(
        controller.setStrategy(accounts[1], strategy.address, new BN(0), {
          from: admin,
        })
      ).to.be.rejected
    })
  })
})
