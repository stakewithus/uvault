import brownie

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
BATCH_SIZE = 1000


def test_batch_withdraw(accounts, vault, erc20, signers, account_helper):
    relayer = accounts[1]

    _signers = []
    amounts = []
    mins = []
    nonces = []
    vs = []
    rs = []
    ss = []
    total = 0

    for i in range(BATCH_SIZE):
        if i >= len(signers):
            _signers.append(ZERO_ADDRESS)
            amounts.append(0)
            mins.append(0)
            nonces.append(0)
            vs.append(0)
            rs.append(0)
            ss.append(0)
        else:
            signer = signers[i]
            amount = 1000
            _min = 1000
            nonce = 0

            txHash = vault.getTxHash(vault, signer, amount, _min, nonce)
            sig = account_helper.sign(signer, txHash)

            total += amount
            _signers.append(signer.address)
            amounts.append(amount)
            mins.append(_min)
            nonces.append(nonce)
            vs.append(sig.v)
            rs.append(sig.r)
            ss.append(sig.s)

            # mint ERC20 to signer, approve vault to spend
            erc20.mint(signer, amount)
            erc20.approve(vault, amount, {'from': signer})

            # deposit
            vault.deposit(signer, amount)

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

    for signer in signers:
        addr = signer.address
        bal = erc20.balanceOf(addr)
        shares = vault.balanceOf(addr)

        before["erc20"]["balances"][addr] = bal
        before["vault"]["balances"][addr] = shares

    # batch deposit
    vault.batchWithdraw(_signers, amounts, mins, total, nonces, vs, rs, ss, {
        'from': relayer
    })

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

    for signer in signers:
        addr = signer.address
        bal = erc20.balanceOf(addr)
        shares = vault.balanceOf(addr)

        after["erc20"]["balances"][addr] = bal
        after["vault"]["balances"][addr] = shares

    # check ERC20 balances
    for i, signer in enumerate(signers):
        addr = signer.address
        assert after["erc20"]["balances"][addr] == before["erc20"]["balances"][addr] + amounts[i]

    # check vault shares
    for i, signer in enumerate(signers):
        addr = signer.address
        assert after["vault"]["balances"][addr] == before["vault"]["balances"][addr] - amounts[i]


def test_batch_withdraw_not_relayer(accounts, vault, erc20, signers, account_helper):
    _signers = []
    amounts = []
    mins = []
    nonces = []
    vs = []
    rs = []
    ss = []
    total = 0

    for i in range(BATCH_SIZE):
        _signers.append(ZERO_ADDRESS)
        amounts.append(0)
        mins.append(0)
        nonces.append(0)
        vs.append(0)
        rs.append(0)
        ss.append(0)

    with brownie.reverts("dev: !relayer"):
        vault.batchWithdraw(
            _signers, amounts, mins, total, nonces, vs, rs, ss
        )
