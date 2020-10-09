const bre = require("@nomiclabs/buidler")

async function main() {
  const network = bre.network.name
  console.log(`Deploying ERC20Token to ${network} network...`)

  try {
    const [deployer] = await ethers.getSigners()

    console.log("Account:", await deployer.getAddress())
    console.log("Balance:", (await deployer.getBalance()).toString())

    // We get the contract to deploy
    const ERC20Token = await ethers.getContractFactory("ERC20Token")
    const token = await ERC20Token.deploy()

    await token.deployed()

    console.log("ERC20Token deployed to:", token.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
