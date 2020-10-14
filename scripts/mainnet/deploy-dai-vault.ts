import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

const MIN_WAIT_TIME = 1 * 60 * 60

async function main() {
  await deploy("DAI Vault", async (_account, _network) => {
    const controller = config.mainnet.controller
    const dai = config.mainnet.dai

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, dai, MIN_WAIT_TIME)

    await vault.deployed()

    return vault
  })
}

main()
