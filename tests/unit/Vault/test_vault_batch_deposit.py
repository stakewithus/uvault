import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
BATCH_SIZE = 1000


def test_batch_deposit(accounts, vault, erc20):
    _accounts = []
    amounts = []

    for i in range(BATCH_SIZE):
        if i >= len(accounts):
            _accounts.append(ZERO_ADDRESS)
            amounts.append(0)
        else:
            account = accounts[i]
            amount = 1000

            _accounts.append(account.address)
            amounts.append(amount)

            # mint ERC20 to signer, approve vault to spend
            erc20.mint(account, amount)
            erc20.approve(vault, amount, {'from': account})

    # snapshot before
    before = {
        "erc20": {
            "balances": {}
        },
        "vault": {
            "balances": {},
            "totalSupply": vault.totalSupply()
        }
    }

    for account in accounts:
        addr = account.address
        bal = erc20.balanceOf(addr)
        shares = vault.balanceOf(addr)

        before["erc20"]["balances"][addr] = bal
        before["vault"]["balances"][addr] = shares

    # batch deposit
    vault.batchDeposit(_accounts, amounts)

    # snapshot after
    after = {
        "erc20": {
            "balances": {}
        },
        "vault": {
            "balances": {},
            "totalSupply": vault.totalSupply()
        }
    }

    for account in accounts:
        addr = account.address
        bal = erc20.balanceOf(addr)
        shares = vault.balanceOf(addr)

        after["erc20"]["balances"][addr] = bal
        after["vault"]["balances"][addr] = shares

    # check ERC20 balances
    for i, account in enumerate(accounts):
        addr = account.address
        assert after["erc20"]["balances"][addr] == before["erc20"]["balances"][addr] - amounts[i]

    # check vault shares
    for i, account in enumerate(accounts):
        addr = account.address
        assert after["vault"]["balances"][addr] == before["vault"]["balances"][addr] + amounts[i]
