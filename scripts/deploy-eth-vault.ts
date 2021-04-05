import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:

npm run clean
npx hardhat compile

env $(cat .env) npx hardhat deploy:eth-vault --network ropsten --dev true
*/
task("deploy:eth-vault", "Deploy ETH vault")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "ETHVault", dev, async (_account, network) => {
      console.log(`Token: ETH`)

      const controller = getAddress(
        config,
        network,
        dev ? "dev_controller" : "controller"
      )
      const timeLock = getAddress(config, network, dev ? "dev_timeLock" : "timeLock")

      const ETHVault = await hre.ethers.getContractFactory("ETHVault")
      return ETHVault.deploy(controller, timeLock)
    })
  })
