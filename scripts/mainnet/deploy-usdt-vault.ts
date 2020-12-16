import {deployVault} from "../lib"
import config from "../config"

async function main() {
  await deployVault("mainnet", config.mainnet.usdt)
}

main()
