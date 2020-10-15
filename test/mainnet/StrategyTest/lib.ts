export function encodeInvest(web3: Web3, vault: string): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "invest",
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
}

export function encodeSetStrategy(web3: Web3, vault: string, strategy: string): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "setStrategy",
      type: "function",
      inputs: [
        {
          type: "address",
          name: "vault",
        },
        {
          type: "address",
          name: "strategy",
        },
      ],
    },
    [vault, strategy]
  )
}

export function encodeHarvest(web3: Web3, strategy: string): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "harvest",
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
}

export function encodeWithdraw(
  web3: Web3,
  strategy: string,
  amount: BN,
  min: BN
): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "withdraw",
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
}

export function encodeWithdrawAll(web3: Web3, strategy: string, min: BN): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "withdrawAll",
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
}

export function encodeExit(web3: Web3, strategy: string, min: BN): string {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "exit",
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
}
