import chai from "chai"
import BN from "bn.js"
import {eq} from "../../util"
import _setup from "./setup"

const TimeLock = artifacts.require("TimeLock")

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  describe("constructor", () => {
    const DELAY = 60 * 60 * 24
    it("should deploy", async () => {
      const timeLock = await TimeLock.new(DELAY, {from: admin})

      assert.equal(await timeLock.admin(), admin, "admin")
      assert(eq(await timeLock.delay(), new BN(DELAY)), "delay")
    })

    it("should reject if delay < min", async () => {
      await chai
        .expect(TimeLock.new(DELAY - 1, {from: admin}))
        .to.be.rejectedWith("delay < min")
    })

    it("should reject if delay > min", async () => {
      await chai
        .expect(TimeLock.new(60 * 60 * 24 * 30 + 1, {from: admin}))
        .to.be.rejectedWith("delay > max")
    })
  })
})
