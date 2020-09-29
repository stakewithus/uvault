usePlugin("@nomiclabs/buidler-waffle")
// usePlugin("@nomiclabs/buidler-etherscan")
// usePlugin("buidler-typechain")
// usePlugin("solidity-coverage")

const fs = require("fs")
const PRIVATE_KEY = fs.readFileSync(".secret").toString().trim()

const INFURA_API_KEY = process.env.INFURA_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.5.17",
    optimizer: {enabled: true, runs: 200},
  },
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: "auto",
      // gasPrice: 5000000000, // 5 gwei
      // gas: "auto",
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    url: "https://api-rinkeby.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
  },
  // typechain: {
  //   outDir: "typechain",
  //   target: "ethers-v4",
  // },
}
