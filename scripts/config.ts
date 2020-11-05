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
    // TODO: deploy time lock
    timeLock: "0x86d10751B18F3fE331C146546868a07224A8598B",
    // vaults //
    daiSafeVault: "0xEf64a0728C6Ede1d7259955a49D046c0fefd6d15",
    usdcSafeVault: "0xEa3818341aA636A1d86D9e35eaF7413e44eCfe5F",
    usdtSafeVault: "0xB96C7E99d5E08b5B033484F68e12fD121647fe2a",
    // TODO deploy degen vaults
    daiDegenVault: "0xEf64a0728C6Ede1d7259955a49D046c0fefd6d15",
    usdcDegenVault: "0xEa3818341aA636A1d86D9e35eaF7413e44eCfe5F",
    usdtDegenVault: "0xB96C7E99d5E08b5B033484F68e12fD121647fe2a",
    // strategies //
    strategyCusdDai: "",
    strategyCusdUsdc: "",
    strategy3CrvDai: "",
    strategy3CrvUsdc: "",
    strategy3CrvUsdt: "",
    strategyP3CrvDai: "",
    strategyP3CrvUsdc: "",
    strategyP3CrvUsdt: "",
    // others //
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
}

export default config
