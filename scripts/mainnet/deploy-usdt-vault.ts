import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("USDT Vault", async (_account, _network) => {
    const {controller, timeLock, usdt} = config.mainnet

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, timeLock, usdt)
  })
}

main()
