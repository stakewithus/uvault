import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyCusdDai", async (_account, _network) => {
    const {controller, daiSafeVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyCusdDai")
    return Strategy.deploy(controller, daiSafeVault)
  })
}

main()
