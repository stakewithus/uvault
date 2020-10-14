import assert from "assert"
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
