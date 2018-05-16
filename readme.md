# Coin Lib

This coin lib is setup in a way that prepare, signing and broadcasting are willingfully separated. This is especially
useful in the context of AirGap. The following operations are specified:

* prepareTransaction - This is done on the broadcaster side. Depending on whether public key or extended public key is used it will fetch the required information from the network
* signTransaction - This is done on the signer side. The output of "prepareTransaction" is the input for this method (hence the output of "prepareTransaction" is transferred via URL scheme).
* broadcastTransaction - This is done on the broadcaster side. The output of "signTransaction" is the input for this method (hence the output of "signTransaction" is transferred via URL scheme).

## Supported Coins

The modular design used in this library allows you to simply add new coins with special logic. Adding a new Bitcoin-like
Coin basically means:

1. select the correct network parameters (see network.js)
2. give the Insight API URL to communicate with the blockchain


Adding a new Ethereum-like Coin means:

1. set the correct chain id
2. set the JSON RPC URL

Adding a new ERC20-like Coin means:

1. set the correct chain id
2. set the JSON RPC URL
3. set the contract address

Currently supported are:

- Bitcoin
- Bitcoin Testnet
- Litecoin
- Zcash
- Zcash Testnet
- Ethereum
- Ethereum Ropsten
- Ethereum Classic
- HOP ERC20 Token on Ropsten

## Features

The way the interface was designed is to allow stateless calls. This means the class itself stores very little state itself.
All required input comes from the method params (public key, extended public key, etc...)

Currently we support for Bitcoin-like coins:

- Single Address Wallets
- HD Wallets

Currently we support for Ethereum-like coins:

- Single Address Wallets (HD-Wallets make no sense for ETH-like)

## Synchronising information between broadcaster and signer

Such that the system works we need to be able to synchronise wallets. A wallet can be:

- Single Address Wallet
- HD Wallet

For the single address wallet we only need to share the public key. For HD Wallet we need to share the extended public key.

## Getting started

Simply do:

````
$ git clone ssh://git@gitlab.papers.tech:10022/airgap/airgap-coin-lib.git
$ cd airgap-coin-lib
$ npm install
$ npm test
````