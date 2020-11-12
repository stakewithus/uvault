import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("Strategy3CrvUsdt", async (_account, _network) => {
    const {controller, usdtSafeVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("Strategy3CrvUsdt")
    return Strategy.deploy(controller, usdtSafeVault)
  })
}

main()
