import { task } from "hardhat/config"
import { deploy } from "./lib2"

const MIN_DELAY = 60 * 60 * 24

/*
usage:
env $(cat .env) npx hardhat deploy:time-lock --network ropsten
*/
task("deploy:time-lock", "Deploy time lock").setAction(async (_args, hre) => {
  await deploy(hre, "TimeLock", async (_account, _network) => {
    const TimeLock = await hre.ethers.getContractFactory("TimeLock")
    return TimeLock.deploy(MIN_DELAY)
  })
})
