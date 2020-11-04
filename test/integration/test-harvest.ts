import chai from "chai"
import {TestTokenInstance} from "../../types/TestToken"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {eq, add} from "../util"
import _setup from "./setup"

contract("integration", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying
  })

  it("should harvest", async () => {
    await controller.harvest(strategy.address, {from: admin})
    assert(await strategy._harvestWasCalled_(), "harvest")
  })

  it("should reject if not authorized", async () => {
    await chai
      .expect(controller.harvest(strategy.address, {from: accounts[1]}))
      .to.be.rejectedWith("!authorized")
  })
})
