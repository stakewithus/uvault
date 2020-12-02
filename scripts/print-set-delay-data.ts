import Web3 from "web3"

// npx ts-node scripts/print-set-delay-data.ts network delay
function main() {
  const network = process.argv[2]
  const delay = parseInt(process.argv[3])

  console.log(`Network: ${network}`)
  console.log(`Delay: ${delay}`)

  const web3 = new Web3()

  const data = web3.eth.abi.encodeFunctionCall(
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

  console.log("Data:")
  console.log(data)
}

main()
