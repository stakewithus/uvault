const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Deploying Vault to ${network} network...`)

  try {
    const controller = getAddress(config, network, "controller")
    const erc20 = getAddress(config, network, "erc20")

    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const minWaitTime = 1 * 60 * 60

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, erc20, minWaitTime)

    await vault.deployed()

    console.log("Vault deployed to:", vault.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
