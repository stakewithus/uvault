import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:

npm run clean
npx hardhat compile

env $(cat .env) npx hardhat deploy:erc20-vault --network ropsten --token testToken --dev true
*/
task("deploy:erc20-vault", "Deploy ERC20 vault")
  .addParam("token", "Name of token")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "ERC20Vault", dev, async (_account, network) => {
      console.log(`Token: ${args.token}`)

      const token = getAddress(config, network, args.token)
      const controller = getAddress(
        config,
        network,
        dev ? "dev_controller" : "controller"
      )
      const timeLock = getAddress(config, network, dev ? "dev_timeLock" : "timeLock")

      const ERC20Vault = await hre.ethers.getContractFactory("ERC20Vault")
      return ERC20Vault.deploy(controller, timeLock, token)
    })
  })
