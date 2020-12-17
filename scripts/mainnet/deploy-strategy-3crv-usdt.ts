import config from "../config"
import {deployStrategy} from "../lib"

async function main() {
  const {usdtSafeVault} = config.mainnet
  await deployStrategy("mainnet", "Strategy3CrvUsdt", usdtSafeVault)
}

main()
