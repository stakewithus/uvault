import assert from "assert"
import { Contract } from "ethers"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { Config } from "./config"

type Network = "mainnet" | "ropsten" | "dev"

export function getAddress(config: Config, network: Network, name: string): string {
  // @ts-ignore
  const addr = config[network][name]
  assert(addr, `${network} ${name} is undefined`)

  return addr
}

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  name: string,
  _deploy: (account: string, network: Network) => Promise<Contract>
) {
  const network = hre.network.name
  console.log(`Network: ${network}`)
  console.log(`Contract: ${name}`)

  try {
    const provider = hre.ethers.providers.getDefaultProvider()
    const [account] = await hre.ethers.getSigners()

    const accountAddr = await account.getAddress()
    const balance = await account.getBalance()
    const gasPrice = await provider.getGasPrice()

    console.log(`Account: ${accountAddr}`)
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`)
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
