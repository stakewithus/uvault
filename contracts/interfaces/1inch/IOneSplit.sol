// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

// Github
// https://github.com/CryptoManiacsZone/1inchProtocol/blob/master/contracts/OneSplitAudit.sol

interface IOneSplit {
    function getExpectedReturn(
        address fromToken,
        address destToken,
        uint amount,
        uint parts,
        uint flags // See constants in IOneSplit.sol
    ) external view returns (uint returnAmount, uint[] memory distribution);

    function getExpectedReturnWithGas(
        address fromToken,
        address destToken,
        uint amount,
        uint parts,
        uint flags, // See constants in IOneSplit.sol
        uint destTokenEthPriceTimesGasPrice
    )
        external
        view
        returns (
            uint returnAmount,
            uint estimateGasAmount,
            uint[] memory distribution
        );

    function swap(
        address fromToken,
        address destToken,
        uint amount,
        uint minReturn,
        uint[] calldata distribution,
        uint flags
    ) external payable returns (uint returnAmount);
}
