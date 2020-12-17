import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { usdtVault } = config.dev
  await deployStrategy("dev", "StrategyGusdUsdt", usdtVault)
}

main()