import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:

npm run clean
npx hardhat compile

env $(cat .env) npx hardhat deploy:strategy \
--network ropsten \
--dev true \
--strategy StrategyNoOpERC20 \
--vault vault \
--token testToken \
--keeper keeper
*/
task("deploy:strategy", "Deploy ER20 / ETH strategy")
  .addParam("strategy", "Name of strategy")
  .addParam("vault", "Name of vault")
  .addOptionalParam("token", "Name of token", "")
  .addOptionalParam("keeper", "Address of keeper", "")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, args.strategy, dev, async (_account, network) => {
      const controller = getAddress(
        config,
        network,
        dev ? "dev_controller" : "controller"
      )
      const vault = getAddress(config, network, args.vault)

      console.log(`strategy: ${args.strategy}`)
      console.log(`${args.vault}: ${vault}`)
      console.log(`token: ${args.token}`)

      const Strategy = await hre.ethers.getContractFactory(args.strategy)
      if (args.token) {
        const token = getAddress(config, network, args.token)
        return Strategy.deploy(controller, vault, token)
      } else if (args.keeper) {
        return Strategy.deploy(controller, vault, args.keeper)
      } else {
        return Strategy.deploy(controller, vault)
      }
    })
  })
