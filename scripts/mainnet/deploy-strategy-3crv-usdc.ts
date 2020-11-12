import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("Strategy3CrvUsdc", async (_account, _network) => {
    const {controller, usdcSafeVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("Strategy3CrvUsdc")
    return Strategy.deploy(controller, usdcSafeVault)
  })
}

main()
