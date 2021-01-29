import chai from "chai"
import { TimeLockInstance } from "../../../types/TimeLock"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("TimeLock", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let timeLock: TimeLockInstance
  beforeEach(() => {
    timeLock = refs.timeLock
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      const tx = await timeLock.setAdmin(accounts[1], { from: admin })

      assert.equal(await timeLock.admin(), accounts[1])
      // check log
      const log = tx.logs[0]
      assert.equal(log.event, "NewAdmin", "log name")
      // @ts-ignore
      assert.equal(log.args.admin, accounts[1], "log args")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(timeLock.setAdmin(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(timeLock.setAdmin(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
