import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    await strategy.deposit({ from: admin, value: DEPOSIT_AMOUNT })
  })

  it("should deleverage", async () => {
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
    // redeemable
    let r = s.sub(b.mul(pow(10, 18)).div(safeCol))
    for (let i = 0; i < 10; i++) {
      if (r.gte(b)) {
        r = b
      }
      s = s.sub(r)
      b = b.sub(r)
      r = s.sub(b.mul(pow(10, 18)).div(safeCol))
      // console.log(`${s} ${b} ${r}`)
    }

    const before = await snapshot()
    await strategy.deleverage(s, { from: admin })
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
