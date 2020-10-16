import assert from "assert"
import bre from "@nomiclabs/buidler"
import {BuidlerRuntimeEnvironment} from "@nomiclabs/buidler/types"
import {Contract} from "ethers"
import {Config} from "./config"

export function getAddress(config: Config, network: string, name: string): string {
  // @ts-ignore
  const addr = config[network][name]
  assert(addr, `${network}.${name} is undefined`)

  return addr
}

export async function getAccountAddress(
  bre: BuidlerRuntimeEnvironment
): Promise<string> {
  const [account] = await bre.ethers.getSigners()

  const addr = await account.getAddress()
  const balance = await account.getBalance()

  console.log("Account:", addr)
  console.log("Balance:", bre.ethers.utils.formatEther(balance), "ETH")

  return addr
}

export async function deploy(
  name: string,
  _deploy: (account: string, network: string) => Promise<Contract>
) {
  const network = bre.network.name
  console.log(`Network: ${network}`)
  console.log(`Contract: ${name}`)

  try {
    const account = await getAccountAddress(bre)

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
