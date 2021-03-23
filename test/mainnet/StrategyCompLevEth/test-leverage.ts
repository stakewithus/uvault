import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { frac, pow, sendEther } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    await sendEther(web3, admin, strategy.address, 10)
    await strategy.supply(DEPOSIT_AMOUNT, { from: admin })
  })

  it("should leverage", async () => {
    const snapshot = getSnapshot(refs)

    const {
      0: supplied,
      1: borrowed,
      2: marketCol,
      3: safeCol,
    } = await strategy.getLivePosition.call() // use static call

    // target supply
    let s = supplied
    let b = borrowed
    for (let i = 0; i < 3; i++) {
      b = s.mul(safeCol).div(pow(10, 18)).sub(b)
      s = s.add(b)
      // console.log(`${s} ${b}`)
    }

    const before = await snapshot()
    await strategy.leverage(s, { from: admin })
    const after = await snapshot()

    // console.log(`${s}`)
    // console.log(`${after.strategy.supplied}`)
    // console.log(`${after.strategy.borrowed}`)

    const delta = frac(pow(10, 18), 1, 100000)

    if (after.strategy.supplied > s) {
      assert(after.strategy.supplied.sub(s).lte(delta), "supplied")
    } else {
      assert(s.sub(after.strategy.supplied).lte(delta), "supplied")
    }
  })
})
