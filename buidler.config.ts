import fs from "fs"
import {BuidlerConfig, usePlugin} from "@nomiclabs/buidler/config"

usePlugin("@nomiclabs/buidler-ethers")

const MAINNET_PRIVATE_KEY = fs.readFileSync(".secret.mainnet").toString().trim()
const TESTNET_PRIVATE_KEY = fs.readFileSync(".secret.testnet").toString().trim()

const INFURA_API_KEY = process.env.INFURA_API_KEY
// const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const config: BuidlerConfig = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.5.17",
    optimizer: {enabled: true, runs: 200},
  },
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`0x${TESTNET_PRIVATE_KEY}`],
      gasPrice: "auto",
      // gasPrice: 5000000000, // 5 gwei
      // gas: "auto",
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`0x${MAINNET_PRIVATE_KEY}`],
      gasPrice: "auto",
      // gasPrice: 5000000000, // 5 gwei
      // gas: "auto",
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  // etherscan: {
  //   url: "https://api-ropsten.etherscan.io/api",
  //   apiKey: ETHERSCAN_API_KEY,
  // },
}

export default config
