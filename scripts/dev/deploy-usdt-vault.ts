import {deployVault} from "../lib"
import config from "../config"

async function main() {
  await deployVault("dev", config.mainnet.usdt)
}

main()
