# Unagi Vault

```shell
cp .env.sample .env.test
# unit test
ganache-cli

truffle test test/unit/**/test-*.js

# test mainnet fork
source .env.test

ganache-cli \
--fork https://mainnet.infura.io/v3/$WEB3_INFURA_PROJECT_ID \
--unlock $STABLE_COIN_HOLDER \
--unlock $DAI_WHALE \
--unlock $USDC_WHALE \
--networkId 999

truffle test --network mainnet_fork
```
