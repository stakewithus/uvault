import pytest
import brownie


def test_replay_tx(
    accounts, gasRelayer, chiToken, txReceiver
):

    # mint gas token to gas relayer
    gasRelayer.mintGasToken(100, {'from': accounts[0]})

    # balance of gas token before tx
    before = chiToken.balanceOf(gasRelayer)

    value = 10
    data = "0x121212"
    call_data = txReceiver.callMe.encode_input(data)

    gasRelayer.relayTx(value, txReceiver, call_data)

    # balance of gas token after tx
    after = chiToken.balanceOf(gasRelayer)

    #  check tx was relayed
    assert txReceiver.data() == data

    #  check gas token was spent
    assert after == before - value


def test_replay_tx_not_whitelist(accounts, gasRelayer, txReceiver):
    with brownie.reverts("dev: !whitelist"):
        gasRelayer.relayTx(0, txReceiver, "0x00", {'from': accounts[1]})


def test_replay_tx_not_enough_gas_token(accounts, gasRelayer, txReceiver):
    with brownie.reverts("dev: gas token balance < value"):
        gasRelayer.relayTx(100, txReceiver, "0x00", {'from': accounts[0]})
