import Web3 from "web3"

// npx ts-node scripts/print-invest-data.ts vault-address
function main() {
  const vault = process.argv[2]

  const FUNCTION = "invest"
  console.log(`function: ${FUNCTION}`)

  console.log("----- inputs -----")
  console.log(`vault: ${vault}`)

  const web3 = new Web3()

  const data = web3.eth.abi.encodeFunctionCall(
    {
      name: FUNCTION,
      type: "function",
      inputs: [
        {
          type: "address",
          name: "vault",
        },
      ],
    },
    [vault]
  )

  console.log("----- data -----")
  console.log(data)
}

main()
