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

  describe("execute", () => {
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

    it("should execute", async () => {
      await time.increase(DELAY + 1000)

      const tx = await timeLock.execute(txReceiver.address, value, DATA, eta, {
        from: admin,
      })

      assert.equal(await timeLock.queued(txHash), false, "queued")
      // check TxReceiver was called
      assert.equal(await txReceiver._data_(), "0x1212", "tx data")

      // check log
      const log = tx.logs[0]
      assert.equal(log.event, "Execute", "log name")
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
          timeLock.execute(txReceiver.address, value, DATA, eta, { from: accounts[3] })
        )
        .to.be.rejectedWith("!admin")
    })

    it("should reject if not queued", async () => {
      // change eta to get different tx hash
      const eta = now + DELAY + 1000
      await chai
        .expect(timeLock.execute(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("!queued")
    })

    it("should reject if now < eta", async () => {
      await chai
        .expect(timeLock.execute(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("eta < now")
    })

    it("should reject if eta expired", async () => {
      await time.increase(DELAY + 100 + 60 * 60 * 24 * 14 + 1)

      await chai
        .expect(timeLock.execute(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("eta expired")
    })

    it("should reject if call fails", async () => {
      await time.increase(DELAY + 1000)
      await txReceiver._setFail_(true)

      await chai
        .expect(timeLock.execute(txReceiver.address, value, DATA, eta, { from: admin }))
        .to.be.rejectedWith("tx failed")
    })
  })
})
