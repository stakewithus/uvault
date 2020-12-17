import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { daiGrowthVault } = config.mainnet
  await deployStrategy("mainnet", "StrategyPdaiDai", daiGrowthVault)
}

main()
