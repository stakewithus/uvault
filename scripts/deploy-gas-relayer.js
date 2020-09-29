const bre = require("@nomiclabs/buidler")

const CHI = "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c"

async function main() {
  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    // We get the contract to deploy
    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    const gasRelayer = await GasRelayer.deploy(CHI)

    await gasRelayer.deployed()

    console.log("GasRelayer deployed to:", gasRelayer.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
