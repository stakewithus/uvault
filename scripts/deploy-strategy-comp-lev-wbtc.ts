import assert from "assert"
import { task } from "hardhat/config"
import config, { WBTC, CWBTC, TOKEN_TO_VAULT } from "./config"
import { deploy, getAddress } from "./lib"

const STRATEGY = "StrategyCompLevDai"
const TOKEN = WBTC
const CTOKEN = CWBTC

/*
usage:
env $(cat .env) npx hardhat deploy:strategy-comp-lev-wbtc \
--network mainnet \
--dev true
*/
task("deploy:strategy-comp-lev-wbtc", `Deploy ${STRATEGY}`)
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, STRATEGY, dev, async (account, network) => {
      assert(network == "mainnet", "network != mainnet")

      const controller = getAddress(config, network, dev, "controller")
      const vault = TOKEN_TO_VAULT[dev ? "dev" : "mainnet"][TOKEN]
      const keeper = account

      console.log(`strategy: ${STRATEGY}`)
      console.log(`controller: ${controller}`)
      console.log(`vault: ${vault}`)
      console.log(`keeper: ${keeper}`)
      console.log(`token: ${TOKEN}`)
      console.log(`cToken: ${CTOKEN}`)

      const Strategy = await hre.ethers.getContractFactory(STRATEGY)
      return Strategy.deploy(controller, vault, CTOKEN, keeper)
    })
  })
