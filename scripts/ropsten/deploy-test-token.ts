import assert from "assert"
import { task } from "hardhat/config"
import { deploy } from "../lib"

/*
usage:
env $(cat .env) npx hardhat deploy:test-token --network ropsten
*/
task("deploy:test-token", "Deploy controller").setAction(async (_args, hre) => {
  assert(hre.network.name === "ropsten", `network != ropsten`)

  await deploy(hre, "TestToken", false, async (_account, _network) => {
    const TestToken = await hre.ethers.getContractFactory("TestToken")
    return TestToken.deploy()
  })
})
