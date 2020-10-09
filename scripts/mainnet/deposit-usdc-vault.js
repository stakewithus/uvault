const BN = require("bn.js")
const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAddress} = require("../lib")

const amount = new BN(10).pow(new BN(6)).mul(new BN(10))

async function main() {
  const network = bre.network.name
  console.log(`Depositing into USDC vault on ${network} network...`)

  try {
    const USDC_ADDRESS = getAddress(config, network, "usdc")
    const USDC_VAULT_ADDRESS = getAddress(config, network, "usdcVault")

    const [account] = await ethers.getSigners()

    const accountAddress = await account.getAddress()
    console.log("Account:", accountAddress)
    console.log("Balance:", (await account.getBalance()).toString())

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS)
    const vault = await ethers.getContractAt("Vault", USDC_VAULT_ADDRESS)

    async function snapshot() {
      return {
        usdc: {
          balances: {
            account: await usdc.balanceOf(accountAddress),
            vault: await usdc.balanceOf(vault.address),
          },
          allowance: {
            vault: await usdc.allowance(accountAddress, vault.address),
          },
        },
      }
    }

    const before = await snapshot()

    const after = await snapshot()

    console.log("=== before ===")
    console.log()
    console.log("USDC balance")
    console.log("============")
    console.log("account ", before.usdc.balances.account.toString())
    console.log("vault   ", before.usdc.balances.vault.toString())
    console.log()
    console.log("USDC allowance")
    console.log("==============")
    console.log("account to vault", before.usdc.allowance.vault.toString())

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
