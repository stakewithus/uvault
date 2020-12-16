import {deployVault} from "../lib"
import config from "../config"

async function main() {
  await deployVault("ropsten", config.ropsten.testToken)
}

main()
