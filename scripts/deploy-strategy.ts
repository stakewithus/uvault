import assert from "assert"
import { task } from "hardhat/config"
import config, { STRATEGIES } from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:strategy \
--network ropsten \
--strategy StrategyTest \
--dev false
*/
task("deploy:strategy", "Deploy vault")
  .addParam("strategy", "Name of strategy")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, args.strategy, dev, async (_account, network) => {
      console.log(`strategy: ${args.strategy}`)

      const vault = getAddress(
        config,
        network,
        dev,
        // @ts-ignore
        STRATEGIES[dev ? "dev" : network][args.strategy].vault
      )

      console.log(`vault: ${vault}`)

      // @ts-ignore
      const _token = STRATEGIES[dev ? "dev" : network][args.strategy].token
      const controller = getAddress(config, network, dev, "controller")

      const Strategy = await hre.ethers.getContractFactory(args.strategy)
      if (_token) {
        const token = getAddress(config, network, dev, _token)
        return Strategy.deploy(controller, vault, token)
      } else {
        return Strategy.deploy(controller, vault)
      }
    })
  })
