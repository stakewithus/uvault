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

function encodeSwitchStrategy(web3, vault) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "switchStrategy",
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

function encodeWithdrawAll(web3, strategy) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "withdrawAll",
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
  encodeSwitchStrategy,
  encodeHarvest,
  encodeWithdrawAll,
  encodeExit,
}
