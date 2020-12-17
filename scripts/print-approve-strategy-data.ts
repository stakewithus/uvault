import Web3 from "web3"
import config from "./config"
import { getAddress } from "./lib"

// npx ts-node scripts/print-approve-strategy-data.ts network strategy-name false
function main() {
  const network = process.argv[2]
  const strategy = process.argv[3]
  const dev = process.argv[4] === "true"
  // @ts-ignore
  const address = getAddress(config, network, dev, strategy)

  console.log(`Network: ${network}`)
  console.log(`Strategy: ${strategy}`)
  console.log(`Address: ${address}`)

  const web3 = new Web3()

  const data = web3.eth.abi.encodeFunctionCall(
    {
      name: "approveStrategy",
      type: "function",
      inputs: [
        {
          type: "address",
          name: "strategy",
        },
      ],
    },
    [address]
  )

  console.log("Data:")
  console.log(data)
}

main()
