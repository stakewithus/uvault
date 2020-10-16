import {ethers} from "@nomiclabs/buidler"
import {deploy} from "../lib"

async function main() {
  await deploy("ERC20Token", async (_account, _network) => {
    const ERC20Token = await ethers.getContractFactory("ERC20Token")
    return ERC20Token.deploy()
  })
}

main()
