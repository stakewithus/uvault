export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
export const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
export const BUSD = "0x4Fabb145d64652a948d72533023f6E7A623C7C53"
export const GUSD = "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"
export const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"

export interface Config {
  ropsten: {
    treasury: string
    controller: string
    timeLock: string
    erc20Vault: string
    ethVault: string
    strategyErc20Test: string
    strategyNoOpErc20: string
    strategyEthTest: string
    strategyNoOpEth: string
    testToken: string
  }
  mainnet: {
    treasury: string
    controller: string
    timeLock: string
    // vaults
    daiSafeVault: string
    usdcSafeVault: string
    usdtSafeVault: string
    busdVault: string
    wbtcVault: string
    ethVault: string
    // strategies //
    // ETH
    strategyNoOpEth: string
    strategyStEth: string
    // DAI
    strategyNoOpDaiSafe: string
    strategyGusdDaiV2: string
    // USDC
    strategyNoOpUsdcSafe: string
    strategyGusdUsdcV2: string
    // USDT
    strategyNoOpUsdtSafe: string
    strategyGusdUsdtV2: string
    // WBTC
    strategyNoOpWbtc: string
    strategyObtcWbtc: string
    // dev //
    dev_controller: string
    dev_treasury: string
    dev_timeLock: string
    // dev vaults //
    dev_daiVault: string
    dev_usdcVault: string
    dev_usdtVault: string
    dev_busdVault: string
    dev_gusdVault: string
    dev_wbtcVault: string
    dev_ethVault: string
    // dev strategies //
    dev_strategyAaveDai: string
    dev_strategyAaveUsdc: string
    dev_strategyAaveUsdt: string
    dev_strategyBusdBusdV2: string
    dev_strategyBusdDaiV2: string
    dev_strategyBusdUsdcV2: string
    dev_strategyBusdUsdtV2: string
    dev_strategyGusdDaiV2: string
    dev_strategyGusdGusdV2: string
    dev_strategyGusdUsdcV2: string
    dev_strategyGusdUsdtV2: string
    dev_strategyNoOpDai: string
    dev_strategyNoOpUsdc: string
    dev_strategyNoOpUsdt: string
    dev_strategyPaxDai: string
    dev_strategyPaxUsdc: string
    dev_strategyPaxUsdt: string
    dev_strategyStEth: string
    dev_strategyObtcWbtc: string
    dev_strategyCompLevDai: string
    dev_strategyCompLevUsdc: string
    dev_strategyCompLevWbtc: string
    dev_strategyCompLevEth: string
    // misc //
    dai: string
    usdc: string
    usdt: string
    busd: string
    gusd: string
    wbtc: string
  }
}

const config: Config = {
  ropsten: {
    // CHI gas token
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0x9015bEb1B80380e8733B449C9cD7f8C3A857d86a",
    timeLock: "0xDb3906814Cc730ef4c8A5cf5C63A523494224150",
    // vaults //
    erc20Vault: "0x83698950B13d0B8B1eAF37D6f0f584E6D71D4964",
    ethVault: "0x2405927Cfa0087C53593A9D97FEE8BcADDc6A008",
    // strategies //
    strategyErc20Test: "0x3Dfd432250d319Aae738Ee0a1C454Ba58E39b7a7",
    strategyNoOpErc20: "0xb2Fb90fC0e16DfeD26eD3169803847A52420Bdd9",
    strategyEthTest: "0x30584B0354c918a7553f17c9E71ef2E355639210",
    strategyNoOpEth: "0x73D4c6cF5EaBC4A7743bCffeA0c49F8495e85EF0",
    // others //
    // used for testinng
    testToken: "0x7F56619E1fAaF6c06B96225e6c8c737F0BBc91c5",
  },
  mainnet: {
    treasury: "0x1C064EA662365c09c8E87242791dAcbb90002605",
    controller: "0x7D55C795359eB049FF482c8Bd5E0523F0fB40B6f",
    timeLock: "0x8dcb98361a49550593B57747Ab2825983EF43662",
    // vaults //
    daiSafeVault: "0x4aD0b81f92B16624BBcF46FC0030cFBBf8d02376",
    usdcSafeVault: "0xBc5991cCd8cAcEba01edC44C2BB9832712c29cAB",
    usdtSafeVault: "0x178Bf8fD04b47D2De3eF3f6b3D112106375ad584",
    // daiGrowthVault: "0x388029Bd38cf6CA61D3f74CA2984d37CFdB8e3fA",
    // usdcGrowthVault: "0xEAa84fc94bCE3028050D185657eBcA4B3dcc232B",
    // usdtGrowthVault: "0x0b3A87aFfbFe0F38490DA657a813A95e7844B38a",
    busdVault: "",
    wbtcVault: "0x3aF5Ba94C29a8407785f5f6d90eF5d69a8EB2436",
    ethVault: "0x77607588222e01bf892a29Abab45796A2047fc7b",
    // strategies //
    // ETH
    strategyNoOpEth: "0xF4Fe5Cc9425B58544AFd24D8a2b14D7EBa261019",
    strategyStEth: "0xcF10DDfEd92d9538cA15ba5c1e89E5c6619a5d3c",
    // DAI
    strategyNoOpDaiSafe: "0xC13A321d800d2477D35BFE342f14368752Bdc82f",
    strategyGusdDaiV2: "0xAa6a0f286A0DEF717e9167B770C795Cb4D72c15B",
    // USDC
    strategyNoOpUsdcSafe: "0xc63942159F8aDf59D180EAB1333F23495aEF12Ad",
    strategyGusdUsdcV2: "0x85cb4Da19994f20cdd55527155C650CB3E613CA3",
    // USDT
    strategyNoOpUsdtSafe: "0x8c8C11C0caE2e5Da0407c7B2A823167B5436c746",
    strategyGusdUsdtV2: "0x7C420415803BEb2B8BE06973a1488f2F5cB02551",
    // WBTC
    strategyNoOpWbtc: "0xeB49133796491205ac324D7b796D5ebD852377e3",
    strategyObtcWbtc: "0x1eda1B993860E2EEC59Bae8E0D8F646Ea9dd154F",

    // v1 strategies //
    /*
    strategyNoOpSafeDai: "0xB8B2d189DB65A50422A444cA284f04c6421F610B",
    strategyNoOpSafeUsdc: "0x63a72001F48e3bbd461C268b7Bb417374D0b19a1",
    strategyNoOpSafeUsdt: "0x9120EC076162d464eeEFB058f3376E770d325335",
    strategyNoOpGrowthDai: "0x3FA09208a066853DB14be80d93A440Ffa529D0ea",
    strategyNoOpGrowthUsdc: "0x87E0F7400FeBe60f7361a5F5533327278Adb84DE",
    strategyNoOpGrowthUsdt: "0x7Ff2f6A01980d8b80c17269Eb9cBb23694Ffb10D",
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
    */
    // dev //
    dev_controller: "0x19Db7587b1ebcF1320cBf55626027365BCC8de27",
    dev_treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    // time lock set to admin
    dev_timeLock: "0x86d10751B18F3fE331C146546868a07224A8598B",
    // dev vaults //
    dev_daiVault: "0xFd9f501324c07613f8Fb4d73C798D764D0BFcdcC",
    dev_usdcVault: "0x167E3254a9298ebF29F67e0AE0326d2018c9bC44",
    dev_usdtVault: "0xdADa607772Ad29f5a90a8817532Ebf983709af15",
    dev_busdVault: "0x45DD58a3Af5F283e819c5d2709Fe237422969150",
    dev_gusdVault: "0xC62b2aC62Ba74979132c14f5c655EdBA5e959111",
    dev_wbtcVault: "0x96281343406dEBf869bf100B733ffeEF23c852b7",
    dev_ethVault: "0x72E357f7635163493F153A0Bd3F03C15C14A51C6",
    // dev strategies //
    dev_strategyAaveDai: "0x9AA973C668f74B112bFF830a202cb3771e401Eb0",
    dev_strategyAaveUsdc: "0x33ec900B63E61E145fdD4c0cdE97AB1148CF4B47",
    dev_strategyAaveUsdt: "0xeC813E53Af13dDA77EAEF1a4B5804DB5f8208F2E",
    dev_strategyBusdBusdV2: "0x06BA23E98f79B856fa93cFB7a337dE359fc4d146",
    dev_strategyBusdDaiV2: "0x12934308F994cd6d7055480B7CB06c4630A57aEE",
    dev_strategyBusdUsdcV2: "0x7010F68e6e35f40116629B4C679c7e89D289a27E",
    dev_strategyBusdUsdtV2: "0x007246570B8D8Ca41efb348FfFDb767C60b4F8fE",
    dev_strategyGusdDaiV2: "0x1D3139146e850c76AF79aD1Af0368f2af217A5F6",
    dev_strategyGusdGusdV2: "0x82375E59A7afE3a06F52f1B2ee68DE8d781E0006",
    dev_strategyGusdUsdcV2: "0x03ace9C69E33d6638c179545FF93439f3F591D44",
    dev_strategyGusdUsdtV2: "0xB5a1c7477A1f2c3aF4F56c633dA47a2521f18C6D",
    dev_strategyNoOpDai: "0x1b79EbE1C9c128Eb30e6f6EBb0741991B696ab80",
    dev_strategyNoOpUsdc: "0x64d43B0D0EDfa8434059d12bCF861da7eE8dD4bc",
    dev_strategyNoOpUsdt: "0xc2e4e82853c28DCF81930852E5A055236364d8F6",
    dev_strategyPaxDai: "0x2b3512efBeeb609CF9D49486b6e2DD9CF10Be6c9",
    dev_strategyPaxUsdc: "0xb1F1AeD30dFe5787dFb65F6Cb96D90b3ae347F68",
    dev_strategyPaxUsdt: "0x3032dBB5DB8aB5Bd85bf2Ca496e02Ce5378A5726",
    dev_strategyStEth: "0x6E1051876ea57e957FdB8A501c7445466Bb643bf",
    dev_strategyObtcWbtc: "0x83Db07ac03cB3d2FC5204507eA4b8c211E5B5383",
    dev_strategyCompLevDai: "0x6Fa810B5D14e2a4859FDBff3BA7E81761b395bDA",
    dev_strategyCompLevUsdc: "0xC5d4e04059B736e95B198a3Be6D49eDc813cE361",
    dev_strategyCompLevWbtc: "0x46E4628436b250d3Ebc4BDFFFf6b01306085Cd04",
    dev_strategyCompLevEth: "0xD4039d16D3E501759C2b1776BFe2E1e7b0981eb5",
    // misc //
    dai: DAI,
    usdc: USDC,
    usdt: USDT,
    busd: BUSD,
    gusd: GUSD,
    wbtc: WBTC,
  },
}

export default config
