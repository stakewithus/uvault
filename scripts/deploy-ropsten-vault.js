const bre = require("@nomiclabs/buidler")

const UNDERLYING = "0x8D760CAbe956332e6021990FCCE40CBDDd5d7890"
const controller = "0xB1fA981B43EC0D5B2C6537DBcfFc7599613d7d39"

async function main() {
  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const minWaitTime = 1 * 60 * 60

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, UNDERLYING, minWaitTime)

    await vault.deployed()

    console.log("Vault deployed to:", vault.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
