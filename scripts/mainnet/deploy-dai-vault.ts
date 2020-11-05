import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("DAI Vault", async (_account, _network) => {
    const {controller, timeLock, dai} = config.mainnet

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, timeLock, dai)
  })
}

main()
