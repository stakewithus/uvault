const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Deploying StrategyTest to ${network} network...`)

  try {
    const erc20 = getAddress(config, network, "erc20")
    const controller = getAddress(config, network, "controller")
    const vault = getAddress(config, network, "vault")

    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const Strategy = await ethers.getContractFactory("StrategyTest")
    const strategy = await Strategy.deploy(controller, vault, erc20)

    await strategy.deployed()

    console.log("StrategyTest deployed to:", strategy.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
