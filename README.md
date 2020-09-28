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

# NOTE
# restart ganache when you see this error
# Error: Returned error: Returned error: project ID does not have access to archive state

# test specific file
truffle test --network mainnet_fork test/mainnet/path/to/test.js
```

### Lint

```shell
npm run ethlint
npm run lint
```

### Slither

```shell
docker run -it -v $PWD:/code trailofbits/eth-security-toolbox

solc-select 0.5.17
cd /code
# slither analysis
slither .

# quick review
slither . --print human-summary

slither . --print inheritance-graph
xdot contracts.dot

slither . --print contract-summary

# in-depth review
slither . --print call-graph
slither . --print cfg
slither . --print function-summary
slither . --print vars-and-auth
```

### APY

```
Ai = total value of assets locked in vault + strategy at time i
Si = total amount of shares at time i

Ai / Si = amount of assets you can claim per share

APY = (An / Sn) / (A0 / S0) - 1
where n = 12

dAi = change in value of assets from time i to i + 1
A_(i+1) = Ai + dAi

# Things that change dAi
+ deposit
- withdraw
+ harvest
+/- assets locked in other Defi to yield fees and interest
+/- price of LP tokens
```
