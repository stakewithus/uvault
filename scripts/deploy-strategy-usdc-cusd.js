const bre = require("@nomiclabs/buidler")

const controller = "0x5676502A9819a8f1b2F5010f971455D2bB77d9C6"
const vault = "0x12d15E6FD8f1a9028bF605529feF9FD61c5887FD"

async function main() {
  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const Strategy = await ethers.getContractFactory("StrategyUsdcToCusd")
    const strategy = await Strategy.deploy(controller, vault)

    await strategy.deployed()

    console.log("Strategy USDC to cUSD deployed to:", strategy.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
