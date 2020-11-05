import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyP3CrvDai", async (_account, _network) => {
    const {controller, usdcDegenVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyP3CrvUsdc")
    return Strategy.deploy(controller, usdcDegenVault)
  })
}

main()
