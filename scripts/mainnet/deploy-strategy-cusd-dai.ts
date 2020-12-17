import config from "../config"
import { deployStrategy } from "../lib"

async function main() {
  const { daiSafeVault } = config.mainnet
  await deployStrategy("mainnet", "StrategyCusdDai", daiSafeVault)
}

main()
