import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

const MIN_WAIT_TIME = 1 * 60 * 60

async function main() {
  await deploy("USDT Vault", async (_account, _network) => {
    const controller = config.mainnet.controller
    const usdt = config.mainnet.usdt

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, usdt, MIN_WAIT_TIME)
  })
}

main()
