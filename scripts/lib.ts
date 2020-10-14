import assert from "assert"
import bre, {ethers} from "@nomiclabs/buidler"
import {Contract} from "ethers"
import {Config} from "./config"

export function getAddress(config: Config, network: string, name: string): string {
  // @ts-ignore
  const addr = config[network][name]
  assert(addr, `${network}.${name} is undefined`)

  return addr
}

export async function getAccount(ethers: any): Promise<string> {
  const [account] = await ethers.getSigners()

  const addr = await account.getAddress()
  console.log("Account:", addr)
  console.log("Balance:", (await account.getBalance()).toString())

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
    const account = await getAccount(ethers)

    const contract = await _deploy(account, network)

    console.log("Deployed to:", contract.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
