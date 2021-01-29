import chai from "chai"
// @ts-ignore
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

  describe("queue", () => {
    let now: number
    let value: number
    let eta: number
    beforeEach(async () => {
      now = (await time.latest()).toNumber()
      value = 0
      eta = now + DELAY + 100
    })

    it("should queue", async () => {
      const tx = await timeLock.queue(txReceiver.address, value, DATA, eta, {
        from: admin,
      })

      const txHash = await timeLock.getTxHash(txReceiver.address, value, DATA, eta)

      assert.equal(await timeLock.queued(txHash), true, "queued")

      // check log
      const log = tx.logs[0]
      assert.equal(log.event, "Queue", "log name")
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
          timeLock.queue(txReceiver.address, value, DATA, eta, { from: accounts[1] })
        )
        .to.be.rejectedWith("!admin")
    })

    it("should reject if ETA < now + delay", async () => {
      eta = now + DELAY - 1

      await chai
        .expect(timeLock.queue(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("eta < now + delay")
    })
  })
})
