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
  );
}

module.exports = {
  encodeInvest,
};
