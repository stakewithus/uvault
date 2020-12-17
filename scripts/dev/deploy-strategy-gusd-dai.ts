import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { daiVault } = config.dev
  await deployStrategy("dev", "StrategyGusdDai", daiVault)
}

main()
