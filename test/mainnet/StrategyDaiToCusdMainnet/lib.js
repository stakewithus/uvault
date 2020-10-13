function getSnapshot({strategy, dai, cUsd, cGauge, crv, vault, treasury}) {
  return async () => {
    const snapshot = {
      strategy: {
        totalAssets: await strategy.totalAssets(),
      },
      dai: {
        vault: await dai.balanceOf(vault),
        strategy: await dai.balanceOf(strategy.address),
        treasury: await dai.balanceOf(treasury),
      },
      cUsd: {
        strategy: await cUsd.balanceOf(strategy.address),
      },
      cGauge: {
        strategy: await cGauge.balanceOf(strategy.address),
      },
      crv: {
        strategy: await crv.balanceOf(strategy.address),
      },
    }

    return snapshot
  }
}

module.exports = {
  getSnapshot,
}
