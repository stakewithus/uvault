import Web3 from "web3"
import BN from "bn.js"

// npx ts-node scripts/print-exit-data.ts strategy-address min
function main() {
  const strategy = process.argv[2]
  const min = new BN(process.argv[3])

  const FUNCTION = "exit"
  console.log(`function: ${FUNCTION}`)

  console.log("----- inputs -----")
  console.log(`strategy: ${strategy}`)
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
          name: "min",
        },
      ],
    },
    [strategy, min.toString()]
  )

  console.log("----- data -----")
  console.log(data)
}

main()
