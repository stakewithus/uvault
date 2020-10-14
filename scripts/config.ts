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
    strategyUsdcToCusd: string
    strategyDaiTo3Crv: string
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
    controller: "0xE6aFde27f7c76f8a2C74Cf25056Ae74785db2693",
    // vaults //
    vault: "0x9D5363c03b6B22a097B86e9204870Fedbb977f81",
    // strategies //
    strategyTest: "0x9cb376ab9052360142798e0EF46ECF19BCd04E2A",
    // others //
    // used for testinng
    erc20: "0x8D760CAbe956332e6021990FCCE40CBDDd5d7890",
  },
  mainnet: {
    // CHI gas token
    gasToken: "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c",
    gasRelayer: "0xe26C446fDCcD62F97a1D6bC21DD92638B0191037",
    treasury: "0x9a4c3Fc4683b95EBF11B535057B00812f6a549Bb",
    controller: "0xE95EABc97a96dAc94fABE254E22EdD8B881b8E19",
    // vaults //
    daiVault: "0x75FCf5cd547Dd312F8c1Cf5000Ad44CF521fCF7f",
    usdcVault: "0x51B4c5f40C24D8494Ac334470df74b753E938efF",
    usdtVault: "0x81C8254FE76bfdA31978f8E9801d0266ca82E4E5",
    // strategies //
    strategyDaiToCusd: "0x68CefF6A5722e9FEFf3d40Ed680Eff8ABAaA9783",
    strategyUsdcToCusd: "0x0dDA2b6D771789803803798cFD3C7Ea55BED7C2F",
    strategyDaiTo3Crv: "0xE8D868cb353c8cAa97c7B1bA2521A4Ce28893fF6",
    strategyUsdcTo3Crv: "0x1AFF70f008aD14d7d7956632074673d5a09566B0",
    strategyUsdtTo3Crv: "0x2328E2625A214BF7cD168Bd980f6eF9C6981c1f6",
    // others //
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
}

export default config
