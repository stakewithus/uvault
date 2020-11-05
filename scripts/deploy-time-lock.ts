import {ethers} from "@nomiclabs/buidler"
import {deploy} from "./lib"

const DELAY = 60 * 60 * 24

async function main() {
  await deploy("TimeLock", async (_account, _network) => {
    const TimeLock = await ethers.getContractFactory("TimeLock")
    return TimeLock.deploy(DELAY)
  })
}

main()
