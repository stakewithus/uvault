import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib2"

/*
usage:
env $(cat .env) npx hardhat deploy:gas-relayer --network ropsten
*/
task("deploy:gas-relayer", "Deploy gas relayer").setAction(async (_args, hre) => {
  await deploy(hre, "GasRelayer", async (_account, network) => {
    const gasToken = getAddress(config, network, "gasToken")

    const GasRelayer = await hre.ethers.getContractFactory("GasRelayer")
    return GasRelayer.deploy(gasToken)
  })
})
