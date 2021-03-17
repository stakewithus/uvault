import chai from "chai"
import { MockControllerInstance, TestTokenInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

const StrategyERC20Split = artifacts.require("StrategyERC20Split")

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: string
  let controller: MockControllerInstance
  let underlying: TestTokenInstance
  let timeLock: string
  let keeper: string
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
    underlying = refs.underlying
    timeLock = refs.timeLock
    keeper = refs.keeper
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const split = await StrategyERC20Split.new(
        controller.address,
        vault,
        underlying.address,
        timeLock,
        keeper
      )

      assert.equal(await split.admin(), admin, "admin")
      assert.equal(await split.controller(), controller.address, "controller")
      assert.equal(await split.vault(), vault, "vault")
      assert.equal(await split.underlying(), underlying.address, "underlying")
      assert.equal(await split.timeLock(), timeLock, "time lock")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Split.new(
            ZERO_ADDRESS,
            vault,
            underlying.address,
            timeLock,
            keeper
          )
        )
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Split.new(
            controller.address,
            ZERO_ADDRESS,
            underlying.address,
            timeLock,
            keeper
          )
        )
        .to.be.rejectedWith("vault = zero address")
    })

    it("should not deploy if underlying is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Split.new(
            controller.address,
            vault,
            ZERO_ADDRESS,
            timeLock,
            keeper
          )
        )
        .to.be.rejectedWith("underlying = zero address")
    })

    it("should not deploy if time lock is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Split.new(
            controller.address,
            vault,
            underlying.address,
            ZERO_ADDRESS,
            keeper
          )
        )
        .to.be.rejectedWith("time lock = zero address")
    })

    it("should not deploy if keeper is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Split.new(
            controller.address,
            vault,
            underlying.address,
            timeLock,
            ZERO_ADDRESS
          )
        )
        .to.be.rejectedWith("keeper = zero address")
    })
  })
})
