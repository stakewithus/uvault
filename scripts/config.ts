export interface Config {
  ropsten: {
    gasToken: string
    gasRelayer: string
    treasury: string
    controller: string
    timeLock: string
    vault: string
    strategyTest: string
    testToken: string
  }
  mainnet: {
    gasToken: string
    gasRelayer: string
    treasury: string
    controller: string
    timeLock: string
    // low risk vaults
    daiSafeVault: string
    usdcSafeVault: string
    usdtSafeVault: string
    // higher risk vaults
    daiGrowthVault: string
    usdcGrowthVault: string
    usdtGrowthVault: string
    // strategies
    strategyCusdDai: string
    strategyCusdUsdc: string
    strategy3CrvDai: string
    strategy3CrvUsdc: string
    strategy3CrvUsdt: string
    strategyP3CrvDai: string
    strategyP3CrvUsdc: string
    strategyP3CrvUsdt: string
    strategyPdaiDai: string
    // others
    dai: string
    usdc: string
    usdt: string
  }
}

const config: Config = {
  ropsten: {
    // CHI gas token
    gasToken: "0x063f83affbcf64d7d84d306f5b85ed65c865dca4",
    gasRelayer: "0xD01D18440A150581A36581adD5b2bcb2DCc63333",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0xE71e05B175b7D4B79Af587521f5F353DAaBd2A8a",
    timeLock: "0xF75715Df8c6f2283cb23D85A3206ac9638C422a5",
    // vaults //
    vault: "0x8fAFc60718a57e6200947130146F0B8cC645d360",
    // strategies //
    strategyTest: "0x7a0cdf8a8c1d7873E49BB45D735a533b3cD78E27",
    // others //
    // used for testinng
    testToken: "0x7F56619E1fAaF6c06B96225e6c8c737F0BBc91c5",
  },
  mainnet: {
    // CHI gas token
    gasToken: "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c",
    gasRelayer: "0x3d85984C88fA9a75Ad0F341CC279A6BCdB54767e",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0x13195FA27De3FC1b5AdcFB9b005989157600EFCC",
    timeLock: "0x8dcb98361a49550593B57747Ab2825983EF43662",
    // safe vaults //
    daiSafeVault: "0x4aD0b81f92B16624BBcF46FC0030cFBBf8d02376",
    usdcSafeVault: "0xBc5991cCd8cAcEba01edC44C2BB9832712c29cAB",
    usdtSafeVault: "0x178Bf8fD04b47D2De3eF3f6b3D112106375ad584",
    // growth vaults //
    daiGrowthVault: "0x388029Bd38cf6CA61D3f74CA2984d37CFdB8e3fA",
    usdcGrowthVault: "0xEAa84fc94bCE3028050D185657eBcA4B3dcc232B",
    usdtGrowthVault: "0x0b3A87aFfbFe0F38490DA657a813A95e7844B38a",
    // strategies //
    strategyCusdDai: "0x9459cD762eA42C7B4e0Dea24d5f427D5a07094D7",
    strategyCusdUsdc: "0xd050bd4F1f4E5Bc7E864333E367099BAd5cA0B3D",
    strategy3CrvDai: "0x2B193D22570FA134115E8Cf0a6709e9cf4De7E44",
    strategy3CrvUsdc: "0x6589B18246482Ddd31A30AeE2864E765211f404f",
    strategy3CrvUsdt: "0xAC6B27B9A57E0d1BDd2c471f83F3D91Ab36df980",
    // TODO need to re-deploy, point to growth vaults
    strategyP3CrvDai: "0xCd9A4c92c90a7ABC63dBCb60a1A0A60054A4139b",
    strategyP3CrvUsdc: "0x34B2aBE99E4654bd1bCB55BF42707c997Bf9A799",
    strategyP3CrvUsdt: "0x41017dDc66583b24EcA97D53a4c9512462126daf",
    strategyPdaiDai: "0x399ce456b198BD5C82586e0281F5742FA5228f76",
    // others //
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
}

export default config
