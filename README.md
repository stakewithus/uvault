# Unagi Vault

### Contract Design Goals

- Safety > Gas cost > ROI
- permissionless deposit / withdraw

### Contract Architecture

![unagi arch](unagi-arch.png)

### Install

```shell
npm i
npm run compile
```

### Test

```shell
cp .env.sample .env
# unit test
npm run test:unit
# integration test
npm run test:integration

# test mainnet fork
source .env

ganache-cli \
--fork https://mainnet.infura.io/v3/$INFURA_API_KEY \
--unlock $STABLE_COIN_HOLDER \
--unlock $DAI_WHALE \
--unlock $USDC_WHALE \
--unlock $USDT_WHALE \
--unlock $CHI_WHALE \
--networkId 999

# NOTE
# restart ganache when you see this error
# Error: Returned error: Returned error: project ID does not have access to archive state

# test specific file
truffle test --network mainnet_fork test/mainnet/path/to/test.ts
# test all (need to restart truffle after each test)
find test/mainnet -name "test-*.ts" -exec truffle test --network mainnet_fork {} \;
```

### Lint

```shell
npm run solhint
npm run lint
```

### Slither

```shell
docker run -it -v $PWD:/code trailofbits/eth-security-toolbox

solc-select 0.6.11
cd /code
# slither analysis
slither --exclude-dependencies .

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

### Deploy

```shell
env $(cat .env) npx hardhat run scripts/script-to-run.ts --network ropsten
```

##### Deploy Vault

1. Deploy `Vault` with `timeLock` set to `admin`
2. Deploy `StrategyNoOp`
3. `Vault.approveStrategy(address of StrategyNoOp)`
4. Deploy, approve and set any other strategy
5. `Vault.setTimelock(address of timeLock contract)`
6. `Vault.setAdmin(address of multi sig)`

##### Deployed Contracts

See [scripts/config.ts](./scripts/config.ts)

##### Verify Contract on Etherscan

```shell
# Warning: Temporary delete any unnecessary contracts and clear the artifacts and build
# otherwise these will also be part of the verified contract.
env $(cat .env) npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS CONSTRUCTOR_ARG_1 CONSTRUCTOR_ARG_2 ...
```

##### Flatten Contracts

```shell
npm i -g truffle-flattener
truffle-flattener <solidity-files>
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
