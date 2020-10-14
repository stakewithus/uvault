import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy, getAddress} from "../lib"

const MIN_WAIT_TIME = 1 * 60 * 60

async function main() {
  await deploy("StrategyTest", async (_account, network) => {
    const controller = getAddress(config, network, "controller")
    const erc20 = getAddress(config, network, "erc20")

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, erc20, MIN_WAIT_TIME)

    await vault.deployed()

    return vault
  })
}

main()
