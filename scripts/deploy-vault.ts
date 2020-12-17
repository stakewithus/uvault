import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib2"

/*
usage:
env $(cat .env) npx hardhat deploy:vault --network ropsten --token testToken
*/
task("deploy:vault", "Deploy vault")
  .addParam("token", "Name of token")
  .setAction(async (args, hre) => {
    await deploy(hre, "Vault", async (_account, network) => {
      console.log(`token: ${args.token}`)

      const token = getAddress(config, network, args.token)
      const controller = getAddress(config, network, "controller")
      const timeLock = getAddress(config, network, "timeLock")

      const Vault = await hre.ethers.getContractFactory("Vault")
      return Vault.deploy(controller, timeLock, token)
    })
  })
