const bre = require("@nomiclabs/buidler")
const config = require("./config")
const {getAddress} = require("./lib")

async function main() {
  const network = bre.network.name
  console.log(`Deploying Controller to ${network} network...`)

  try {
    const gasRelayer = getAddress(config, network, "gasRelayer")
    const treasury = getAddress(config, network, "treasury")

    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    // We get the contract to deploy
    const Controller = await ethers.getContractFactory("Controller")
    const controller = await Controller.deploy(treasury, gasRelayer)

    await controller.deployed()

    console.log("Controller deployed to:", controller.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
