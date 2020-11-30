import fs from "fs"
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"

const MAINNET_PRIVATE_KEY = fs.readFileSync(".secret.mainnet").toString().trim()
const TESTNET_PRIVATE_KEY = fs.readFileSync(".secret.testnet").toString().trim()

const INFURA_API_KEY = process.env.INFURA_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const config: HardhatUserConfig = {
  solidity: {
    version: "0.6.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
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
  etherscan: {
    // url: "https://api-ropsten.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
  },
}

export default config
