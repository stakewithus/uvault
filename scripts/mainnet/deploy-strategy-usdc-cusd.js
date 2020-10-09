const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Deploying StrategyUsdcToCusd to ${network} network...`)

  try {
    const controller = getAddress(config, network, "controller")
    const usdcVault = getAddress(config, network, "usdcVault")

    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const Strategy = await ethers.getContractFactory("StrategyUsdcToCusdMainnet")
    const strategy = await Strategy.deploy(controller, usdcVault)

    await strategy.deployed()

    console.log("StrategyUsdcToCusd deployed to:", strategy.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
