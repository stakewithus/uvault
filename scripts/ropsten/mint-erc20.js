const BN = require("bn.js")
const bre = require("@nomiclabs/buidler")
const config = require("../config")
const {getAccountAddress, getAddress} = require("../lib")

async function main() {
  const network = bre.network.name
  console.log(`Minting ERC20Token on ${network} network...`)

  try {
    const ERC20_ADDRESS = getAddress(config, network, "erc20")
    const ACCOUNT_ADDRESS = await getAccountAddress(ethers)

    const erc20 = await ethers.getContractAt("ERC20Token", ERC20_ADDRESS)

    async function snapshot() {
      return {
        erc20: {
          balances: {
            account: await erc20.balanceOf(ACCOUNT_ADDRESS),
          },
        },
      }
    }

    const amount = ethers.utils.parseUnits("100", 18)

    const before = await snapshot()
    const tx = await erc20.mint(ACCOUNT_ADDRESS, amount)
    console.log(`Tx hash: ${tx.hash}`)
    await tx.wait()
    const after = await snapshot()

    console.log("=== before ===")
    console.log("ERC balance", before.erc20.balances.account.toLocaleString())

    console.log("=== after ===")
    console.log("ERC balance", after.erc20.balances.account.toLocaleString())

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
