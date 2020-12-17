import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { usdcGrowthVault } = config.mainnet
  await deployStrategy("mainnet", "StrategyP3CrvUsdc", usdcGrowthVault)
}

main()
