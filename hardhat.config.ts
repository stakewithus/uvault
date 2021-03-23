import fs from "fs"
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"
// tasks
import "./scripts/deploy-time-lock"
import "./scripts/deploy-controller"
import "./scripts/deploy-erc20-vault"
import "./scripts/deploy-eth-vault"
import "./scripts/deploy-strategy"
import "./scripts/deploy-strategy-comp-lev-dai"
import "./scripts/deploy-strategy-comp-lev-usdc"
import "./scripts/deploy-strategy-comp-lev-wbtc"
import "./scripts/deploy-strategy-comp-lev-eth"

const PRIVATE_KEY = fs.readFileSync(".secret").toString().trim()

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
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: "auto",
      // gasPrice: 5000000000, // 5 gwei
      // gas: "auto",
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: "auto",
      // gasPrice: 5000000000, // 5 gwei
      // gas: "auto",
    },
    // mainnet dev
    dev: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
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
    // url: "https://api-ropsten.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
  },
}

export default config
