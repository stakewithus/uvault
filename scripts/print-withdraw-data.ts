import Web3 from "web3"
import BN from "bn.js"

// npx ts-node scripts/print-withdraw-data.ts strategy-address amount min
function main() {
  const strategy = process.argv[2]
  const amount = new BN(process.argv[3])
  const min = new BN(process.argv[4])

  const FUNCTION = "withdrawAll"
  console.log(`function: ${FUNCTION}`)

  console.log("----- inputs -----")
  console.log(`strategy: ${strategy}`)
  console.log(`amount: ${amount}`)
  console.log(`min: ${min}`)

  const web3 = new Web3()

  const data = web3.eth.abi.encodeFunctionCall(
    {
      name: FUNCTION,
      type: "function",
      inputs: [
        {
          type: "address",
          name: "strategy",
        },
        {
          type: "uint256",
          name: "amount",
        },
        {
          type: "uint256",
          name: "min",
        },
      ],
    },
    [strategy, amount.toString(), min.toString()]
  )

  console.log("----- data -----")
  console.log(data)
}

main()
