import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("ERC20 Test Vault", async (_account, _network) => {
    const {controller, timeLock, testToken} = config.ropsten

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, timeLock, testToken)
  })
}

main()
