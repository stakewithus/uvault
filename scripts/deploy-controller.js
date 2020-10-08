const bre = require("@nomiclabs/buidler")

const gasRelayer = "0x7e5b8bA159b326F2DF74e4357DB42D17801896c7"
const treasury = "0xF5B0149971eAb068D2d365ac9626d94A2AedceC4"

async function main() {
  try {
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
