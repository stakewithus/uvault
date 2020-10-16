import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

const MIN_WAIT_TIME = 1 * 60 * 60

async function main() {
  await deploy("ERC20 Test Vault", async (_account, _network) => {
    const {controller, erc20} = config.ropsten

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, erc20, MIN_WAIT_TIME)

    await vault.deployed()

    return vault
  })
}

main()
