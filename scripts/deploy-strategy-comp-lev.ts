import assert from "assert"
import { task } from "hardhat/config"
import config from "./config"
import { deploy, getAddress } from "./lib"

// Compound
const CDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const CUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const CWBTC = "0xccF4429DB6322D5C611ee964527D42E5d685DD6a"
const CETH = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5"

const TOKEN_TO_CTOKEN_ADDRESS = {
  dai: CDAI,
  usdc: CUSDC,
  wbtc: CWBTC,
  eth: CETH,
}

const TOKEN_TO_STRATEGY_NAME = {
  dai: "StrategyCompLevDai",
  usdc: "StrategyCompLevUsdc",
  wbtc: "StrategyCompLevWbtc",
  eth: "StrategyCompLevEth",
}

const TOKEN_TO_VAULT_NAME = {
  dai: "daiSafeVault",
  usdc: "usdcSafeVault",
  wbtc: "wbtcVault",
  eth: "ethVault",
}

const TOKEN_TO_DEV_VAULT_NAME = {
  dai: "dev_daiVault",
  usdc: "dev_usdcVault",
  wbtc: "dev_wbtcVault",
  eth: "dev_ethVault",
}

/*
usage:
env $(cat .env) npx hardhat deploy:strategy-comp-lev \
--network mainnet \
--dev true \
--token [one of dai, usdc, wbtc, eth]
*/
task("deploy:strategy-comp-lev", `Deploy StrategyCompLev`)
  .addParam("token", "Name of token")
  .addOptionalParam("dev", "Use mainnet dev", "false")
  .setAction(async (args, hre) => {
    assert(args.dev === "false" || args.dev === "true", `invalid arg dev: ${args.dev}`)
    const dev = args.dev === "true"

    // @ts-ignore
    const strategyName = TOKEN_TO_STRATEGY_NAME[args.token]
    // @ts-ignore
    const vaultName = dev
      ? // @ts-ignore
        TOKEN_TO_DEV_VAULT_NAME[args.token]
      : // @ts-ignore
        TOKEN_TO_VAULT_NAME[args.token]

    // @ts-ignore
    await deploy(hre, strategyName, dev, async (account, network) => {
      assert(network == "mainnet", "network != mainnet")

      const controller = getAddress(
        config,
        network,
        dev ? "dev_controller" : "controller"
      )
      const vault = getAddress(config, network, vaultName)
      const keeper = account
      // @ts-ignore
      const cToken = TOKEN_TO_CTOKEN_ADDRESS[args.token]

      console.log(`strategy: ${strategyName}`)
      console.log(`controller: ${controller}`)
      console.log(`${vaultName}: ${vault}`)
      console.log(`keeper: ${keeper}`)
      console.log(`token: ${args.token}`)
      console.log(`cToken: ${cToken}`)

      const Strategy = await hre.ethers.getContractFactory(strategyName)
      return Strategy.deploy(controller, vault, cToken, keeper)
    })
  })
