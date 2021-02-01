import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:eth-vault --network ropsten --dev false
*/
task("deploy:eth-vault", "Deploy ETH vault")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "ETHVault", dev, async (_account, network) => {
      console.log(`Token: ETH`)

      const controller = getAddress(config, network, dev, "controller")
      const timeLock = getAddress(config, network, dev, "timeLock")

      const ETHVault = await hre.ethers.getContractFactory("ETHVault")
      return ETHVault.deploy(controller, timeLock)
    })
  })