const bre = require("@nomiclabs/buidler")

const UNDERLYING = "0x8D760CAbe956332e6021990FCCE40CBDDd5d7890"
const controller = "0xB1fA981B43EC0D5B2C6537DBcfFc7599613d7d39"
const vault = "0x8496d69D51dF633a851B0CE96b33974BDfeAff73"

async function main() {
  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const Strategy = await ethers.getContractFactory("StrategyTest")
    const strategy = await Strategy.deploy(controller, vault, UNDERLYING)

    await strategy.deployed()

    console.log("Strategy Test deployed to:", strategy.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
