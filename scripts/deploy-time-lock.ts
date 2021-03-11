import assert from "assert"
import { task } from "hardhat/config"
import { deploy } from "./lib"

const MIN_DELAY = 60 * 60 * 24

/*
usage:
env $(cat .env) npx hardhat deploy:time-lock --network ropsten --dev true
*/
task("deploy:time-lock", "Deploy time lock")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    await deploy(hre, "TimeLock", dev, async (_account, _network) => {
      const TimeLock = await hre.ethers.getContractFactory("TimeLock")
      return TimeLock.deploy(MIN_DELAY)
    })
  })
