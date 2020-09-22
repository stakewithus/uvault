function getSnapshot({ strategy, usdc, cUsd, cGauge, vault, treasury }) {
  return async () => {
    const snapshot = {
      strategy: {
        underlyingBalance: await strategy.underlyingBalance(),
      },
      usdc: {
        vault: await usdc.balanceOf(vault),
        strategy: await usdc.balanceOf(strategy.address),
        treasury: await usdc.balanceOf(treasury),
      },
      cUsd: {
        strategy: await cUsd.balanceOf(strategy.address),
      },
      cGauge: {
        strategy: await cGauge.balanceOf(strategy.address),
      },
    };

    return snapshot;
  };
}

module.exports = {
  getSnapshot,
};
