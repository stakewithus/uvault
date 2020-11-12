import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyTest", async (_account, _network) => {
    const {testToken, controller, vault} = config.ropsten

    const Strategy = await ethers.getContractFactory("StrategyTest")
    return Strategy.deploy(controller, vault, testToken)
  })
}

main()
