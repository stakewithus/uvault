const assert = require("assert")
const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAccountAddress, getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Depositing into USDC vault on ${network} network...`)

  try {
    const USDC_ADDRESS = getAddress(config, network, "usdc")
    const VAULT_ADDRESS = getAddress(config, network, "usdcVault")

    const ACCOUNT_ADDRESS = await getAccountAddress(ethers)

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS)
    const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS)

    async function snapshot() {
      return {
        usdc: {
          balances: {
            account: await usdc.balanceOf(ACCOUNT_ADDRESS),
            vault: await usdc.balanceOf(vault.address),
          },
          allowance: {
            vault: await usdc.allowance(ACCOUNT_ADDRESS, vault.address),
          },
        },
        vault: {
          shares: {
            account: await vault.balanceOf(ACCOUNT_ADDRESS),
          },
        },
      }
    }

    const DECIMALS = 6
    const MAX_DEPOSIT = ethers.utils.parseUnits("10", DECIMALS)
    const amount = ethers.utils.parseUnits("10", DECIMALS)

    assert(amount.lte(MAX_DEPOSIT), "deposit > max")

    const before = await snapshot()

    // Check USDC balance >= deposit amount
    assert(amount.lte(before.usdc.balances.account), "balance < amount")

    // Approve vault to spend USDC
    console.log("Approve vault...")
    const approveTx = await usdc.approve(vault.address, amount)
    console.log(`tx hash: ${approveTx.hash}`)
    await approveTx.wait()

    // Deposit into vault
    console.log("Deposit into vault...")
    const depositTx = await vault.deposit(amount)
    console.log(`tx hash ${depositTx.hash}`)
    await depositTx.wait()

    const after = await snapshot()

    function printSnapshot(snap) {
      console.log()
      console.log("USDC balance")
      console.log("=============")
      console.log("account ", snap.usdc.balances.account.toString())
      console.log("vault   ", snap.usdc.balances.vault.toString())
      console.log()
      console.log("USDC allowance")
      console.log("===============")
      console.log("account to vault", snap.usdc.allowance.vault.toString())
      console.log("Vault shares")
      console.log("=============")
      console.log("account ", snap.vault.shares.account.toString())
    }

    console.log("=== before ===")
    printSnapshot(before)

    console.log("=== after ===")
    printSnapshot(after)

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
