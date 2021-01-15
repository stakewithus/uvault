import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:strategy \
--network ropsten \
--dev false \
--strategy StrategyNoOp \
--vault vault
--token testToken
*/
task("deploy:strategy", "Deploy vault")
  .addParam("strategy", "Name of strategy")
  .addParam("vault", "Name of vault")
  .addParam("token", "Name of token")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, args.strategy, dev, async (_account, network) => {
      const controller = getAddress(config, network, dev, "controller")
      const vault = getAddress(config, network, dev, args.vault)

      console.log(`strategy: ${args.strategy}`)
      console.log(`${args.vault}: ${vault}`)
      console.log(`token: ${args.token}`)

      const Strategy = await hre.ethers.getContractFactory(args.strategy)
      if (args.token) {
        const token = getAddress(config, network, dev, args.token)
        return Strategy.deploy(controller, vault, token)
      } else {
        return Strategy.deploy(controller, vault)
      }
    })
  })
