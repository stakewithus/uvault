import config from "../config"
import {deployStrategy} from "../lib"

async function main() {
  const {usdcVault} = config.dev
  await deployStrategy("dev", "StrategyPaxUsdc", usdcVault)
}

main()
