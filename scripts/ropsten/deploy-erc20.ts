import bre, {ethers} from "@nomiclabs/buidler"
import {getAccount} from "../lib"

async function main() {
  const network = bre.network.name
  console.log(`Deploying ERC20Token to ${network} network...`)

  try {
    await getAccount(ethers)

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
