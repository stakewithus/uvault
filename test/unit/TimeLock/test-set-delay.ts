import chai from "chai"
//@ts-ignore
import { time } from "@openzeppelin/test-helpers"
import { TimeLockInstance } from "../../../types/TimeLock"
import _setup from "./setup"

export function encodeSetDelay(web3: Web3, delay: number) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "setDelay",
      type: "function",
      inputs: [
        {
          type: "uint256",
          name: "delay",
        },
      ],
    },
    [delay.toString()]
  )
}

contract("TimeLock", (accounts) => {
  const refs = _setup(accounts)
  const { admin, DELAY } = refs

  let timeLock: TimeLockInstance
  beforeEach(() => {
    timeLock = refs.timeLock
  })

  describe("set delay", () => {
    const NEW_DELAY = 60 * 60 * 24 * 2
    const data = encodeSetDelay(web3, NEW_DELAY)

    let now: number
    let value: number
    let eta: number
    let txHash: string
    beforeEach(async () => {
      now = (await time.latest()).toNumber()
      value = 0
      eta = now + DELAY + 100

      await timeLock.queue(timeLock.address, value, data, eta, {
        from: admin,
      })
      txHash = await timeLock.getTxHash(timeLock.address, value, data, eta)
    })

    it("should set delay", async () => {
      await time.increase(DELAY + 1000)

      const tx = await timeLock.execute(timeLock.address, value, data, eta, {
        from: admin,
      })

      assert.equal(await timeLock.queued(txHash), false, "queued")
      assert.equal((await timeLock.delay()).toNumber(), NEW_DELAY, "new delay")

      // check log
      const log = tx.logs[0]
      assert.equal(log.event, "NewDelay", "log name")
      // @ts-ignore
      assert.equal(log.args.delay, NEW_DELAY, "log delay")
    })

    it("should reject if caller not this contract", async () => {
      await chai
        .expect(timeLock.setDelay(123, { from: admin }))
        .to.be.rejectedWith("!timelock")
    })

    it("should reject if delay < min", async () => {
      const NEW_DELAY = 60 * 60 * 24 - 1
      const data = encodeSetDelay(web3, NEW_DELAY)

      now = (await time.latest()).toNumber()
      value = 0
      eta = now + DELAY + 100

      await timeLock.queue(timeLock.address, value, data, eta, {
        from: admin,
      })
      txHash = await timeLock.getTxHash(timeLock.address, value, data, eta)

      await time.increase(DELAY + 1000)

      await chai
        .expect(timeLock.execute(timeLock.address, value, data, eta, { from: admin }))
        .to.be.rejectedWith("tx failed")
    })

    it("should reject if eta > max", async () => {
      const NEW_DELAY = 60 * 60 * 24 * 30 + 1
      const data = encodeSetDelay(web3, NEW_DELAY)

      now = (await time.latest()).toNumber()
      value = 0
      eta = now + DELAY + 100

      await timeLock.queue(timeLock.address, value, data, eta, {
        from: admin,
      })
      txHash = await timeLock.getTxHash(timeLock.address, value, data, eta)

      await time.increase(DELAY + 1000)

      await chai
        .expect(timeLock.execute(timeLock.address, value, data, eta, { from: admin }))
        .to.be.rejectedWith("tx failed")
    })
  })
})
