export interface Config {
  ropsten: {
    gasToken: string
    gasRelayer: string
    treasury: string
    controller: string
    vault: string
    strategyTest: string
    erc20: string
  }
  mainnet: {
    gasToken: string
    gasRelayer: string
    treasury: string
    controller: string
    daiVault: string
    usdcVault: string
    usdtVault: string
    strategyDaiToCusd: string
    strategyDaiTo3Crv: string
    strategyUsdcToCusd: string
    strategyUsdcTo3Crv: string
    strategyUsdtTo3Crv: string
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
    controller: "0xd8a66AC84E1fAb8e0383DED05662132430c4a4D8",
    // vaults //
    vault: "0x59f49CF5e35417e3a5d14B261253500a2f108154",
    // strategies //
    strategyTest: "0x074A8b5c382a1327Dd3D12bfF30D0Cd5E57969B1",
    // others //
    // used for testinng
    erc20: "0x8D760CAbe956332e6021990FCCE40CBDDd5d7890",
  },
  mainnet: {
    // CHI gas token
    gasToken: "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c",
    gasRelayer: "0xe26C446fDCcD62F97a1D6bC21DD92638B0191037",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0xdDA49776E897BB9C6c6D0f98EE4b409795cdcE2b",
    // vaults //
    daiVault: "0x8C63c3C29868dB34349ca9EF4a3eD6ccA7210bBE",
    usdcVault: "0xdeb4A1149fe09Eecff1eC25BB3008C4aD236c1b4",
    usdtVault: "0xB25dBe8955806203E8511FFce5D359fE8cAef787",
    // strategies //
    strategyDaiToCusd: "0xFa5D9F59A4E7a9554b983F841C966E4C47F3Bd4F",
    strategyDaiTo3Crv: "0x283948BcEd828fdD289B1a1d61c523f05F8cA43B",
    strategyUsdcToCusd: "0x0690E1CA12E18C78a7dbAae9BDE5328008e3a2ce",
    strategyUsdcTo3Crv: "0xF8daBcEF10d7431462E922812090600a58FB2243",
    strategyUsdtTo3Crv: "0xbDB20f7Bf6E7Adc6cbF5c9F476a0fDE63e494F48",
    // others //
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
}

export default config
