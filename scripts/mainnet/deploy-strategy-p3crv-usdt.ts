import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { usdtGrowthVault } = config.mainnet
  await deployStrategy("mainnet", "StrategyP3CrvUsdt", usdtGrowthVault)
}

main()
