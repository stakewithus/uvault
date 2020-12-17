import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:vault --network ropsten --token testToken --dev false
*/
task("deploy:vault", "Deploy vault")
  .addParam("token", "Name of token")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "Vault", dev, async (_account, network) => {
      console.log(`token: ${args.token}`)

      const token = getAddress(config, network, dev, args.token)
      const controller = getAddress(config, network, dev, "controller")
      const timeLock = getAddress(config, network, dev, "timeLock")

      const Vault = await hre.ethers.getContractFactory("Vault")
      return Vault.deploy(controller, timeLock, token)
    })
  })
