import {ethers} from "@nomiclabs/buidler"
import {deploy} from "../lib"

async function main() {
  await deploy("TestToken", async (_account, _network) => {
    const TestToken = await ethers.getContractFactory("TestToken")
    return TestToken.deploy()
  })
}

main()
