import assert from "assert"
import { Contract } from "ethers"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { Config } from "./config"

type Network = "mainnet" | "ropsten"

export function getAddress(config: Config, network: Network, name: string): string {
  // @ts-ignore
  const addr = config[network][name]
  assert(addr, `${network} ${name} is undefined`)

  return addr
}

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  name: string,
  dev: boolean,
  _deploy: (account: string, network: Network) => Promise<Contract>
) {
  const network = hre.network.name
  console.log(`Network: ${network}`)
  console.log(`Dev: ${dev}`)
  console.log(`Contract: ${name}`)

  if (dev) {
    assert(network === "mainnet", `Must use mainnet for dev = true`)
  }

  try {
    // @ts-ignore
    const provider = hre.ethers.providers.getDefaultProvider()
    // @ts-ignore
    const [account] = await hre.ethers.getSigners()

    const accountAddr = await account.getAddress()
    const balance = await account.getBalance()
    const gasPrice = await provider.getGasPrice()

    console.log(`Account: ${accountAddr}`)
    // @ts-ignore
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`)
    // @ts-ignore
    console.log(`Gas price: ${hre.ethers.utils.formatUnits(gasPrice, "gwei")} gwei`)

    assert(network === "mainnet" || network === "ropsten", `Invalid network ${network}`)
    const contract = await _deploy(accountAddr, network)

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
