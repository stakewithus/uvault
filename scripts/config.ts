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
    // high risk vaults
    daiDegenVault: string
    usdcDegenVault: string
    usdtDegenVault: string
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
    gasRelayer: "0xe26C446fDCcD62F97a1D6bC21DD92638B0191037",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0xdDA49776E897BB9C6c6D0f98EE4b409795cdcE2b",
    timeLock: "0x8dcb98361a49550593B57747Ab2825983EF43662",
    // safe vaults //
    daiSafeVault: "0xEf64a0728C6Ede1d7259955a49D046c0fefd6d15",
    usdcSafeVault: "0xEa3818341aA636A1d86D9e35eaF7413e44eCfe5F",
    usdtSafeVault: "0xB96C7E99d5E08b5B033484F68e12fD121647fe2a",
    // degen vaults //
    daiDegenVault: "0x1133b7AA55fB87Af5dE48A6C908E6436d09F1644",
    usdcDegenVault: "0x4Da0f9627616951BD694fEc66e1A24715dB584b0",
    usdtDegenVault: "0x89814761D8E0C35f0FdC3A88B8c43B459709974A",
    // strategies //
    strategyCusdDai: "0xfF1b8E9b4B77A2F77aeBA30e177DE51D9DdD3B95",
    strategyCusdUsdc: "0x96F605838918d5CFDdA5641726E7c5a31c7106F3",
    strategy3CrvDai: "0x2B193D22570FA134115E8Cf0a6709e9cf4De7E44",
    strategy3CrvUsdc: "0x6589B18246482Ddd31A30AeE2864E765211f404f",
    strategy3CrvUsdt: "0x11C689532C04a8fc09C4df2957266f8F29fe99a4",
    // TODO need to re-deploy, point to degen vaults
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
