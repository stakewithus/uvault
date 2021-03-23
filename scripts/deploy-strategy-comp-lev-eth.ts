import assert from "assert"
import { task } from "hardhat/config"
import config, { CETH } from "./config"
import { deploy, getAddress } from "./lib"

const STRATEGY = "StrategyCompLevEth"
const CTOKEN = CETH

/*
usage:
env $(cat .env) npx hardhat deploy:strategy-comp-lev-eth \
--network mainnet \
--dev true
*/
task("deploy:strategy-comp-lev-eth", `Deploy ${STRATEGY}`)
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, STRATEGY, dev, async (account, network) => {
      assert(network == "mainnet", "network != mainnet")

      const controller = getAddress(config, network, dev, "controller")
      const vault = getAddress(config, network, dev, "ethVault")
      const keeper = account

      console.log(`strategy: ${STRATEGY}`)
      console.log(`vault: ${vault}`)
      console.log(`controller: ${controller}`)
      console.log(`keeper: ${account}`)
      console.log(`cToken: ${CTOKEN}`)

      const Strategy = await hre.ethers.getContractFactory(STRATEGY)
      return Strategy.deploy(controller, vault, CTOKEN, keeper)
    })
  })
