import { task } from "hardhat/config"
import { Contract } from "ethers"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const MIN_DELAY = 60 * 60 * 24

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  name: string,
  _deploy: (account: string, network: string) => Promise<Contract>
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

task("deploy:time-lock", "Deploy time lock").setAction(async (_args, hre) => {
  await deploy(hre, "TimeLock", async (_account, _network) => {
    const TimeLock = await hre.ethers.getContractFactory("TimeLock")
    return TimeLock.deploy(MIN_DELAY)
  })
})
