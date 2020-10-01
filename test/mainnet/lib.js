function encodeInvest(web3, vault) {
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

function encodeRebalance(web3, vault) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "rebalance",
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

function encodeSetStrategy(web3, vault, strategy, min) {
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
        {
          type: "uint256",
          name: "min",
        },
      ],
    },
    [vault, strategy, min.toString()]
  )
}

function encodeHarvest(web3, strategy) {
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

function encodeWithdrawAll(web3, strategy, min) {
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

function encodeExit(web3, strategy) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "exit",
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

module.exports = {
  encodeInvest,
  encodeRebalance,
  encodeSetStrategy,
  encodeHarvest,
  encodeWithdrawAll,
  encodeExit,
}
