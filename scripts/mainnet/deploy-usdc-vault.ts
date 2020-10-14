import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy, getAddress} from "../lib"

const MIN_WAIT_TIME = 1 * 60 * 60

async function main() {
  await deploy("USDC Vault", async (_account, network) => {
    const controller = getAddress(config, network, "controller")
    const usdc = getAddress(config, network, "usdc")

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, usdc, MIN_WAIT_TIME)

    await vault.deployed()

    return vault
  })
}

main()
