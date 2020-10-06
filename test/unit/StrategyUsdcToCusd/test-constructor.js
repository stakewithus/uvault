const BN = require("bn.js")
const {assert} = require("chai")
const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd")

contract("StrategyUsdcToCusd", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let vault
  let controller
  let usdc
  let cUsd
  let depositC
  let gauge
  let minter
  let crv
  let uniswap
  let weth
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
    usdc = refs.usdc
    cUsd = refs.cUsd
    depositC = refs.depositC
    gauge = refs.gauge
    minter = refs.minter
    crv = refs.crv
    uniswap = refs.uniswap
    weth = refs.weth
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await StrategyUsdcToCusd.new(
        controller.address,
        vault.address,
        usdc.address,
        cUsd.address,
        depositC.address,
        gauge.address,
        minter.address,
        crv.address,
        uniswap.address,
        weth.address
      )

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault.address, "vault")
      assert.equal(await strategy.underlying(), usdc.address, "underlying")
    })

    it("should not deploy if controller is zero address", async () => {
      await expect(
        StrategyUsdcToCusd.new(
          ZERO_ADDRESS,
          vault.address,
          usdc.address,
          cUsd.address,
          depositC.address,
          gauge.address,
          minter.address,
          crv.address,
          uniswap.address,
          weth.address
        )
      ).to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await expect(
        StrategyUsdcToCusd.new(
          controller.address,
          ZERO_ADDRESS,
          usdc.address,
          cUsd.address,
          depositC.address,
          gauge.address,
          minter.address,
          crv.address,
          uniswap.address,
          weth.address
        )
      ).to.be.rejectedWith("vault = zero address")
    })
  })
})
