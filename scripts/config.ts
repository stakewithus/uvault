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
    strategyPaxDai: string
    strategyPaxUsdc: string
    strategyPaxUsdt: string
    strategyBusdDai: string
    strategyBusdUsdc: string
    strategyBusdUsdt: string
    strategyGusdDai: string
    strategyGusdUsdc: string
    strategyGusdUsdt: string
    // others
    dai: string
    usdc: string
    usdt: string
  }
  // mainnet dev
  dev: {
    gasToken: string
    gasRelayer: string
    controller: string
    treasury: string
    timeLock: string
    daiVault: string
    usdcVault: string
    usdtVault: string
    strategyPaxDai: string
    strategyPaxUsdc: string
    strategyPaxUsdt: string
    strategyBusdDai: string
    strategyBusdUsdc: string
    strategyBusdUsdt: string
    strategyGusdDai: string
    strategyGusdUsdc: string
    strategyGusdUsdt: string
  }
}

const config: Config = {
  ropsten: {
    // CHI gas token
    gasToken: "0x063f83affbcf64d7d84d306f5b85ed65c865dca4",
    gasRelayer: "0xad2907C6aA26588f579e5D4bEeE6d945ba18BDb4",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0xBf2bFf3A85bC3663E808963be17564D0707D900b",
    timeLock: "0xDb3906814Cc730ef4c8A5cf5C63A523494224150",
    // vaults //
    vault: "0xc8E2357fA7f51e84beBFD4A0075c53D49d0A0D88",
    // strategies //
    strategyTest: "0x0dDA2b6D771789803803798cFD3C7Ea55BED7C2F",
    // others //
    // used for testinng
    testToken: "0x7F56619E1fAaF6c06B96225e6c8c737F0BBc91c5",
  },
  mainnet: {
    // CHI gas token
    gasToken: "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c",
    gasRelayer: "0x3d85984C88fA9a75Ad0F341CC279A6BCdB54767e",
    treasury: "0x1C064EA662365c09c8E87242791dAcbb90002605",
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
    strategy3CrvDai: "0xbc33957CC1Ef9E99D86f06A8af3f5fe22753ec93",
    strategy3CrvUsdc: "0x549452631ec594C0580d0bf313D2dF22304f574F",
    strategy3CrvUsdt: "0xAC6B27B9A57E0d1BDd2c471f83F3D91Ab36df980",
    strategyBusdDai: "0x982cfc1598e8A4e473601DDBEC3699d7C7947717",
    strategyBusdUsdc: "0xE4bF8c52FF170Bed33E52530A103C21ad5f638f9",
    strategyBusdUsdt: "0xAa8fB748fDC8dc72bF278505d9e535aF44208442",
    strategyGusdDai: "0x45f88290f4f5aEB345728542E3074d700AA93b93",
    strategyGusdUsdc: "0xd4F486EA3C68A307c3E8420232eE44d7604a4e99",
    strategyGusdUsdt: "0x58B5Bc0683f22eBb617AE1a504BD12528BE4FB9F",
    strategyPaxDai: "0xF7F6919d1Ae0B075cFb8033F41dAc5C982C8f257",
    strategyPaxUsdc: "0xaEe92DC91d8572482Dc30C344c979fDef843DFcd",
    strategyPaxUsdt: "0xFe08F6D37FCD1ed1CB7f357b23Bfdf77cD1f6A8e",
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
  // mainnet dev
  dev: {
    // CHI gas token
    gasToken: "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c",
    gasRelayer: "0xC946321C467e6865942dfdb2C55d1c78F0A55338",
    controller: "0x75e8336418e30b58d8dAd426F98D3D60244A08d3",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    // time lock set to admin
    timeLock: "0x86d10751B18F3fE331C146546868a07224A8598B",
    daiVault: "0xFd9f501324c07613f8Fb4d73C798D764D0BFcdcC",
    usdcVault: "0x167E3254a9298ebF29F67e0AE0326d2018c9bC44",
    usdtVault: "0xdADa607772Ad29f5a90a8817532Ebf983709af15",
    // strategies //
    strategyBusdDai: "0xffa01cA5FFd9e9F8a24CfdcA8C9157bD59D80405",
    strategyBusdUsdc: "0x042b298B30C67c8921d5376ad9a065E834280F26",
    strategyBusdUsdt: "0xedA38758d7Ea23adc780731d16A4382f17C9e59a",
    strategyGusdDai: "0xfd11221fE0E2c8e552afe8622946946428a17650",
    strategyGusdUsdc: "0x668973f5f8E47844bc75Bbe9BAd9C7AD0542B8bc",
    strategyGusdUsdt: "0xB295bEC46cF0141B7E011Dc19Ae0036796691083",
    strategyPaxDai: "0x2b3512efBeeb609CF9D49486b6e2DD9CF10Be6c9",
    strategyPaxUsdc: "0xb1F1AeD30dFe5787dFb65F6Cb96D90b3ae347F68",
    strategyPaxUsdt: "0x3032dBB5DB8aB5Bd85bf2Ca496e02Ce5378A5726",
  },
}

// mappings from strategy to vault and token
export const STRATEGIES = {
  ropsten: {
    StrategyTest: {
      token: "testToken",
      vault: "vault",
    },
  },
  mainnet: {
    StrategyBusdDai: {
      vault: "daiSafeVault",
    },
    StrategyBusdUsdc: {
      vault: "usdcSafeVault",
    },
    StrategyBusdUsdt: {
      vault: "usdtSafeVault",
    },
    StrategyGusdDai: {
      vault: "daiSafeVault",
    },
    StrategyGusdUsdc: {
      vault: "usdcSafeVault",
    },
    StrategyGusdUsdt: {
      vault: "usdtSafeVault",
    },
    StrategyPaxDai: {
      vault: "daiSafeVault",
    },
    StrategyPaxUsdc: {
      vault: "usdcSafeVault",
    },
    StrategyPaxUsdt: {
      vault: "usdtSafeVault",
    },
  },
  dev: {
    StrategyBusdDai: {
      vault: "daiVault",
    },
    StrategyBusdUsdc: {
      vault: "usdcVault",
    },
    StrategyBusdUsdt: {
      vault: "usdtVault",
    },
    StrategyGusdDai: {
      vault: "daiVault",
    },
    StrategyGusdUsdc: {
      vault: "usdcVault",
    },
    StrategyGusdUsdt: {
      vault: "usdtVault",
    },
    StrategyPaxDai: {
      vault: "daiVault",
    },
    StrategyPaxUsdc: {
      vault: "usdcVault",
    },
    StrategyPaxUsdt: {
      vault: "usdtVault",
    },
  },
}

export default config
