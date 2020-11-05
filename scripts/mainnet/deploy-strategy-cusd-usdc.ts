import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyCusdUsdc", async (_account, _network) => {
    const {controller, usdcSafeVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyCusdUsdc")
    return Strategy.deploy(controller, usdcSafeVault)
  })
}

main()
