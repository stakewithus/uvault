# Unagi Vault

```shell
cp .env.sample .env.test
# unit test
npm run test:unit

# test mainnet fork
source .env.test

ganache-cli \
--fork https://mainnet.infura.io/v3/$WEB3_INFURA_PROJECT_ID \
--unlock $STABLE_COIN_HOLDER \
--unlock $DAI_WHALE \
--unlock $USDC_WHALE \
--unlock $CHI_WHALE \
--networkId 999

npm run test:mainnet

# test specific file
truffle test --network mainnet_fork test/mainnet/path/to/test.js
```
