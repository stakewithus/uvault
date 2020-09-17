# uvault

## Testing and Development

### Dependencies

- [python3](https://www.python.org/downloads/release/python-368/) version 3.6 or greater, python3-dev
- [vyper](https://github.com/vyperlang/vyper) version [0.2.4](https://github.com/vyperlang/vyper/releases/tag/v0.2.4)
- [brownie](https://github.com/iamdefinitelyahuman/brownie) - tested with version [1.10.5](https://github.com/eth-brownie/brownie/releases/tag/v1.10.5)
- [ganache-cli](https://github.com/trufflesuite/ganache-cli) - tested with version [6.10.1](https://github.com/trufflesuite/ganache-cli/releases/tag/v6.10.1)

### Setup

To get started, first install [virtual environment](https://docs.python.org/3/library/venv.html).

```bash
# create and activate virtualenv
virtualenv -p python3 venv
source venv/bin/activate

pip install -r requirements.txt

# install Brownie PM
brownie pm install OpenZeppelin/openzeppelin-contracts@3.0.0

# copy .env.sample and edit
cp .env.sample .env.test
```

### Development

```bash
# access contracts on mainnet
brownie console --network mainnet-fork
```

### Test

```bash
# test
brownie test
# print gas
brownie test --gas
# coverage
brownie test --coverage

# test by forking mainnet
source .env.test

# run mainnet fork with ganache
# NOTE: Unfortunately the Infura key does not point to an archival node.
#       That means you will have to restart ganache-cli every 128 blocks (~30 minutes)
# NOTE: ganache may need to be restarted for each test in tests/mainnet
ganache-cli \
--fork https://mainnet.infura.io/v3/$WEB3_INFURA_PROJECT_ID \
--unlock $STABLE_COIN_HOLDER \
--networkId 1

# test on mainnet and print all logs
brownie test --network mainnet-fork -s
```

### Scripts

```bash
export WEB3_INFURA_PROJECT_ID=ab8ed427a2544fdb869871b7e853243d
```

#### Deploy to Ropsten

Deploy to dev

```
brownie run scripts/deploy_dev.py
```
