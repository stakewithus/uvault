import { ethers } from "hardhat"
import config from "../config"
import { deploy } from "../lib"

async function main() {
  await deploy("DAI Vault", async (_account, _network) => {
    const { controller, timeLock, dai } = config.mainnet

    console.log(`WARNING: time lock is set to admin account ${_account}`)
    console.log(
      `Set time lock to ${timeLock} after you are done approving initial strategy`
    )

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, _account, dai)
  })
}

main()
