export function encodeCallMe(web3: Web3, data: string) {
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
