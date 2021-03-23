import BN from "bn.js"

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const MAX_UINT = new BN(2).pow(new BN(256)).sub(new BN(1))

function cast(x: BN | number): BN {
  if (x instanceof BN) {
    return x
  }
  return new BN(x)
}

export function eq(x: BN | number, y: BN | number): Boolean {
  x = cast(x)
  y = cast(y)
  return x.eq(y)
}

export function gt(x: BN | number, y: BN | number): Boolean {
  x = cast(x)
  y = cast(y)
  return x.gt(y)
}

export function gte(x: BN | number, y: BN | number): Boolean {
  x = cast(x)
  y = cast(y)
  return x.gte(y)
}

export function lt(x: BN | number, y: BN | number): Boolean {
  x = cast(x)
  y = cast(y)
  return x.lt(y)
}

export function lte(x: BN | number, y: BN | number): Boolean {
  x = cast(x)
  y = cast(y)
  return x.lte(y)
}

export function pow(x: BN | number, y: BN | number): BN {
  x = cast(x)
  y = cast(y)
  return x.pow(y)
}

export function add(x: BN | number, y: BN | number): BN {
  x = cast(x)
  y = cast(y)
  return x.add(y)
}

export function sub(x: BN | number, y: BN | number): BN {
  x = cast(x)
  y = cast(y)
  return x.sub(y)
}

export function frac(x: BN | number, n: BN | number, d: BN | number): BN {
  x = cast(x)
  n = cast(n)
  d = cast(d)
  return x.mul(n).div(d)
}

export function mul(x: BN | number, y: BN | number): BN {
  x = cast(x)
  y = cast(y)
  return x.mul(y)
}

export function sendEther(web3: Web3, from: string, to: string, amount: BN | number) {
  const value = cast(amount)
  return web3.eth.sendTransaction({
    from,
    to,
    value: web3.utils.toWei(value.toString(), "ether"),
  })
}

export async function getBlockTimestamp(web3: Web3, tx: any): Promise<number> {
  const block = await web3.eth.getBlock(tx.receipt.blockHash)
  return block.timestamp as number
}
