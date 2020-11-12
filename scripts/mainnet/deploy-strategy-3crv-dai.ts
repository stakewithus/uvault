import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("Strategy3CrvDai", async (_account, _network) => {
    const {controller, daiSafeVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("Strategy3CrvDai")
    return Strategy.deploy(controller, daiSafeVault)
  })
}

main()
