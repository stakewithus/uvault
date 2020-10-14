import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {MockVaultInstance} from "../../../types/MockVault"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin, gasRelayer} = refs

  let controller: ControllerInstance
  let vault: MockVaultInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("setStrategy", () => {
    it("should set strategy admin", async () => {
      await controller.setStrategy(vault.address, strategy.address, {from: admin})

      assert.equal(await vault.strategy(), strategy.address, "strategy")
    })

    it("should set strategy gas relayer", async () => {
      await controller.setStrategy(vault.address, strategy.address, {
        from: gasRelayer,
      })

      assert.equal(await vault.strategy(), strategy.address, "strategy")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(
          controller.setStrategy(vault.address, strategy.address, {
            from: accounts[1],
          })
        )
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if vault does not exist", async () => {
      await chai.expect(
        controller.setStrategy(accounts[1], strategy.address, {from: admin})
      ).to.be.rejected
    })
  })
})
