const assert = require("assert")
const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAccountAddress, getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Depositing into vault on ${network} network...`)

  try {
    const ERC20_ADDRESS = getAddress(config, network, "erc20")
    const VAULT_ADDRESS = getAddress(config, network, "vault")

    const ACCOUNT_ADDRESS = await getAccountAddress(ethers)

    const erc20 = await ethers.getContractAt("ERC20Token", ERC20_ADDRESS)
    const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS)

    async function snapshot() {
      return {
        erc20: {
          balances: {
            account: await erc20.balanceOf(ACCOUNT_ADDRESS),
            vault: await erc20.balanceOf(vault.address),
          },
          allowance: {
            vault: await erc20.allowance(ACCOUNT_ADDRESS, vault.address),
          },
        },
        vault: {
          shares: {
            account: await vault.balanceOf(ACCOUNT_ADDRESS),
          },
        },
      }
    }

    const DECIMALS = 18
    const MAX_DEPOSIT = ethers.utils.parseUnits("10", DECIMALS)
    const amount = ethers.utils.parseUnits("10", DECIMALS)

    assert(amount.lte(MAX_DEPOSIT), "deposit > max")

    const before = await snapshot()

    assert(amount.lte(before.erc20.balances.account), "balance < amount")

    console.log("Approve vault...")
    const approveTx = await erc20.approve(vault.address, amount)
    console.log(`tx hash: ${approveTx.hash}`)
    await approveTx.wait()

    console.log("Deposit into vault...")
    const depositTx = await vault.deposit(amount)
    console.log(`tx hash ${depositTx.hash}`)
    await depositTx.wait()

    const after = await snapshot()

    function printSnapshot(snap) {
      console.log()
      console.log("ERC20 balance")
      console.log("=============")
      console.log("account ", snap.erc20.balances.account.toString())
      console.log("vault   ", snap.erc20.balances.vault.toString())
      console.log()
      console.log("ERC20 allowance")
      console.log("===============")
      console.log("account to vault", snap.erc20.allowance.vault.toString())
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
