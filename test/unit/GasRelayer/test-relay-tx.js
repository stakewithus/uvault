const setup = require("./setup")
const BN = require("bn.js")
const {expect} = require("../../setup")
const {eq} = require("../../util")

function encode(web3, data) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "callMe",
      type: "function",
      inputs: [
        {
          type: "bytes",
          name: "data",
        },
      ],
    },
    [data]
  )
}

contract("GasRelayer", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let gasRelayer
  let gasToken
  let txReceiver
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    txReceiver = refs.txReceiver
  })

  describe("relayTx", () => {
    const amount = new BN(123)
    const data = encode(web3, "0x1212")

    it("should relay tx", async () => {
      gasRelayer.relayTx(amount, txReceiver.address, data, {from: admin})

      assert(eq(await gasToken._freeUpToAmount_(), amount), "free up to amount")
      assert.equal(await txReceiver._data_(), "0x1212", "tx data")
    })

    it("should reject if caller not admin", async () => {
      await expect(
        gasRelayer.relayTx(amount, txReceiver.address, data, {
          from: accounts[1],
        })
      ).to.be.rejectedWith("!admin")
    })

    it("should reject if tx failed", async () => {
      await txReceiver._setFail_(true)

      await expect(
        gasRelayer.relayTx(amount, txReceiver.address, data, {from: admin})
      ).to.be.rejectedWith("failed")
    })
  })
})
