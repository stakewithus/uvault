import assert from "assert"
import hre, { ethers } from "hardhat"
import { Contract } from "ethers"
import config, { Config } from "./config"

type Network = "ropsten" | "mainnet" | "dev"

export function getAddress(config: Config, network: Network, name: string): string {
  // @ts-ignore
  const addr = config[network][name]
  assert(addr, `${network}.${name} is undefined`)

  return addr
}

export async function getAccountAddress(): Promise<string> {
  // @ts-ignore
  const [account] = await hre.ethers.getSigners()

  const addr = await account.getAddress()
  const balance = await account.getBalance()

  console.log("Account:", addr)
  // @ts-ignore
  console.log("Balance:", hre.ethers.utils.formatEther(balance), "ETH")

  return addr
}

export async function deploy(
  name: string,
  _deploy: (account: string, network: string) => Promise<Contract>
) {
  const network = hre.network.name
  console.log(`Network: ${network}`)
  console.log(`Contract: ${name}`)

  try {
    const account = await getAccountAddress()

    const contract = await _deploy(account, network)

    console.log("TX:", contract.deployTransaction.hash)

    // Wait for tx to be mined
    await contract.deployed()

    console.log("Deployed to:", contract.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

export async function deployController(network: Network) {
  await deploy("Controller", async (_account, _network) => {
    const treasury = getAddress(config, network, "treasury")

    const Controller = await ethers.getContractFactory("Controller")
    return Controller.deploy(treasury)
  })
}

export async function deployGasRelayer(network: Network) {
  await deploy("GasRelayer", async (_account, _network) => {
    const gasToken = getAddress(config, network, "gasToken")

    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    return GasRelayer.deploy(gasToken)
  })
}

export async function deployVault(network: Network, token: string) {
  await deploy("Vault", async (_account, _network) => {
    console.log(`token: ${token}`)

    const controller = getAddress(config, network, "controller")
    const timeLock = getAddress(config, network, "timeLock")

    const Vault = await ethers.getContractFactory("Vault")
    return Vault.deploy(controller, timeLock, token)
  })
}

type Strategy =
  | "StrategyCusdDai"
  | "StrategyCusdUsdc"
  | "Strategy3CrvDai"
  | "Strategy3CrvUsdc"
  | "Strategy3CrvUsdt"
  | "StrategyPaxDai"
  | "StrategyPaxUsdc"
  | "StrategyPaxUsdt"
  | "StrategyBusdDai"
  | "StrategyBusdUsdc"
  | "StrategyBusdUsdt"
  | "StrategyGusdDai"
  | "StrategyGusdUsdc"
  | "StrategyGusdUsdt"
  | "StrategyP3CrvDai"
  | "StrategyP3CrvUsdc"
  | "StrategyP3CrvUsdt"
  | "StrategyPdaiDai"

export async function deployStrategy(
  network: Network,
  strategy: Strategy,
  vault: string
) {
  await deploy(strategy, async (_account, _network) => {
    const controller = getAddress(config, network, "controller")

    const Strategy = await ethers.getContractFactory(strategy)
    return Strategy.deploy(controller, vault)
  })
}
