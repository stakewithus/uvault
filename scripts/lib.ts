import assert from "assert"
import hre, { ethers} from "hardhat"
import {Contract} from "ethers"
import config, {Config} from "./config"

export function getAddress(config: Config, network: string, name: string): string {
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

export async function deployController(network: string) {
  await deploy("Controller", async (_account, _network) => {
    const treasury = getAddress(config, network, "treasury")

    const Controller = await ethers.getContractFactory("Controller")
    return Controller.deploy(treasury)
  })
}

export async function deployTimeLock() {
  const MIN_DELAY = 60 * 60 * 24

  await deploy("TimeLock", async (_account, _network) => {
    const TimeLock = await ethers.getContractFactory("TimeLock")
    return TimeLock.deploy(MIN_DELAY)
  })
}

export async function deployGasRelayer() {
  await deploy("GasRelayer", async (_account, network) => {
    const gasToken = getAddress(config, network, "gasToken")

    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    return GasRelayer.deploy(gasToken)
  })
}