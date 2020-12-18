import Web3 from "web3"

// npx ts-node scripts/print-skim-data.ts strategy-address
function main() {
  const strategy = process.argv[2]

  const FUNCTION = "skim"
  console.log(`function: ${FUNCTION}`)

  console.log("----- inputs -----")
  console.log(`strategy: ${strategy}`)

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
      ],
    },
    [strategy]
  )

  console.log("----- data -----")
  console.log(data)
}

main()
