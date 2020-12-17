import config from "../config"
import {deployStrategy} from "../lib"

async function main() {
  const {usdcSafeVault} = config.mainnet
  await deployStrategy("mainnet", "Strategy3CrvUsdc", usdcSafeVault)
}

main()
