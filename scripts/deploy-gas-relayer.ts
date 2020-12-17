import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

/*
usage:
env $(cat .env) npx hardhat deploy:gas-relayer --network ropsten
*/
task("deploy:gas-relayer", "Deploy gas relayer")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "GasRelayer", dev, async (_account, network) => {
      const gasToken = getAddress(config, network, dev, "gasToken")

      const GasRelayer = await hre.ethers.getContractFactory("GasRelayer")
      return GasRelayer.deploy(gasToken)
    })
  })
