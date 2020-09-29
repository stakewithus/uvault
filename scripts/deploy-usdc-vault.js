const bre = require("@nomiclabs/buidler")

// mainnet
// const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
// ropsten mock
const USDC = "0x875c09e0c8efa38917e595556d9f38c7301bcd83"
const controller = "0x5676502A9819a8f1b2F5010f971455D2bB77d9C6"

// strategy deployed at Ropsten
// 0x81534892D9Fe1d650D68c08c110b9c0E409D51fC
async function main() {
  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    const minWaitTime = 24 * 60 * 60

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(controller, USDC, minWaitTime)

    await vault.deployed()

    console.log("Vault deployed to:", vault.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
