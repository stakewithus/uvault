const bre = require("@nomiclabs/buidler")
const config = require("./config")
const {getAddress} = require("./lib")

async function main() {
  const network = bre.network.name
  console.log(`Deploying GasRelayer to ${network} network...`)

  try {
    const gasToken = getAddress(config, network, "gasToken")

    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    const gasRelayer = await GasRelayer.deploy(gasToken)

    await gasRelayer.deployed()

    console.log("GasRelayer deployed to:", gasRelayer.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
