import chai from "chai"
//@ts-ignore
import { time } from "@openzeppelin/test-helpers"
import { TxReceiverInstance } from "../../../types"
import { TimeLockInstance } from "../../../types/TimeLock"
import _setup from "./setup"

contract("TimeLock", (accounts) => {
  const refs = _setup(accounts)
  const { admin, DELAY, DATA } = refs

  let timeLock: TimeLockInstance
  let txReceiver: TxReceiverInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    txReceiver = refs.txReceiver
  })

  describe("cancel", () => {
    let now: number
    let value: number
    let eta: number
    let txHash: string
    beforeEach(async () => {
      now = (await time.latest()).toNumber()
      value = 0
      eta = now + DELAY + 100

      await timeLock.queue(txReceiver.address, value, DATA, eta, {
        from: admin,
      })
      txHash = await timeLock.getTxHash(txReceiver.address, value, DATA, eta)
    })

    it("should cancel", async () => {
      const tx = await timeLock.cancel(txReceiver.address, value, DATA, eta, {
        from: admin,
      })

      assert.equal(await timeLock.queued(txHash), false, "queued")

      // check log
      const log = tx.logs[0]
      assert.equal(log.event, "Cancel", "log name")
      // @ts-ignore
      assert.equal(log.args.txHash, txHash, "log txHash")
      // @ts-ignore
      assert.equal(log.args.target, txReceiver.address, "log target")
      // @ts-ignore
      assert.equal(log.args.value, value, "log value")
      // @ts-ignore
      assert.equal(log.args.data, DATA, "log data")
      // @ts-ignore
      assert.equal(log.args.eta, eta, "log eta")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(
          timeLock.cancel(txReceiver.address, value, DATA, eta, { from: accounts[1] })
        )
        .to.be.rejectedWith("!admin")
    })

    it("should reject if not queued", async () => {
      // change eta to get different tx hash
      const eta = now + DELAY + 1000
      await chai
        .expect(timeLock.cancel(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("!queued")
    })
  })
})
