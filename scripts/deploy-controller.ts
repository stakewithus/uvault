import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib2"

/*
usage:
env $(cat .env) npx hardhat deploy:controller --network ropsten
*/
task("deploy:controller", "Deploy controller").setAction(async (_args, hre) => {
  await deploy(hre, "Controller", async (_account, network) => {
    const treasury = getAddress(config, network, "treasury")

    const Controller = await hre.ethers.getContractFactory("Controller")
    return Controller.deploy(treasury)
  })
})
