import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:controller --network ropsten --dev false
*/
task("deploy:controller", "Deploy controller")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "Controller", dev, async (_account, network) => {
      const treasury = getAddress(config, network, dev, "treasury")

      const Controller = await hre.ethers.getContractFactory("Controller")
      return Controller.deploy(treasury)
    })
  })
