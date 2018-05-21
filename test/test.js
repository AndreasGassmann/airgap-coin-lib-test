const BIP39 = require('bip39')
const assert = require('assert')
const networks = require('../networks')

const bitcoinJS = require('bitcoinjs-lib')
const zcashJS = require('bitcoinjs-lib-zcash')
const request = require('request')

const Web3 = require('web3')
const BigNumber = require('bignumber.js')
const ethUtil = require('ethereumjs-util')
const EthereumTransaction = require('ethereumjs-tx')

const mnemonicPhrase = 'spell device they juice trial skirt amazing boat badge steak usage february virus art survey' // this is what the user writes down and what is saved by secure storage?
const masterSeed = BIP39.mnemonicToSeed(mnemonicPhrase)

const CoinLib = require('../index');

describe('Extended Public Derivation Logic', function () {
	it('should return the correct bitcoin address from extended public key', function () {
		const bitcoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.bitcoin)
		const extendedPublicKey = bitcoinHdNode.derivePath('m/44\'/0\'/0\'').neutered().toBase58()
		// if you call "neutered" it will make sure only the extended public is being used
		// the actual derivation path of the first address is "m/44'/0'/0'/0/0" (it's not hardened (') because hardened keys cannot be derived from public information)
		const bitcoin = new CoinLib.BitcoinProtocol()
		assert.equal(bitcoin.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 0), '15B2gX2x1eqFKgR44nCe1i33ursGKP4Qpi')
		// m/44'/0'/0'/0/0
		assert.equal(bitcoin.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 1), '15srTWTrucPWSUGFZY2LWaYobwpDLknz49')
	})
	it('should return the correct litecoin address from extended public key', function () {
		const litecoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.litecoin)
		const extendedPublicKey = litecoinHdNode.derivePath('m/44\'/2\'/0\'').neutered().toBase58()
		const litecoin = new CoinLib.LitecoinProtocol()
		// m/44'/2'/0'/0/0
		assert.equal(litecoin.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 0), 'LaKxMHETSaWsigMYs88J6ibEGZnLRNWWH1')
		// m/44'/2'/0'/0/1
		assert.equal(litecoin.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 1), 'LQUaS2G2FGB2fnoNmon6ERv94JAk6GR29R')
	})
	it('should return the correct bitcointestnet address from extended public key', function () {
		const bitcoinTestnetHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.testnet)
		const extendedPublicKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'').neutered().toBase58()
		const bitcointestnet = new CoinLib.BitcoinTestnetProtocol()
		// m/44'/1'/0'/0/0
		assert.equal(bitcointestnet.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 0), 'mi1ypWeso8oAxBxYZ8e2grCNBhW1hrbK8k')
		// m/44'/1'/0'/0/1
		assert.equal(bitcointestnet.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 1), 'moK2Ws7YvK3LRppzCuLRVfDkpvZiw7T4cu')
	})
	it('should return the correct zcash address from extended public key', function () {
		const zcashHdNode = zcashJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.zcash)
		const extendedPublicKey = zcashHdNode.derivePath('m/44\'/133\'/0\'').neutered().toBase58()
		const zcash = new CoinLib.ZCashProtocol()
		// m/44'/133'/0'/0/0
		assert.equal(zcash.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 0), 't1PFyZ43MRrVRBWTKqTT5wfimtZ9MFSTgPC')
		// m/44'/133'/0'/0/1
		assert.equal(zcash.getAddressFromExtendedPublicKey(extendedPublicKey, 0, 1), 't1XwXnCQopt16zfAJVb76A7JPerKE9LSg9L')
	})
	it('should return the correct ethereum address from extended public key', function () {
		const bitcoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.bitcoin)
		const publicKey = bitcoinHdNode.derivePath('m/44\'/60\'/0\'').neutered().toBase58()
		const eth = new CoinLib.EthereumProtocol()
		assert.equal(eth.getAddressFromExtendedPublicKey(publicKey, 0, 0), '0x4A1E1D37462a422873BFCCb1e705B05CC4bd922e')
	})
})

describe('Public Derivation Logic', function () {
	it('should return the correct bitcoin address from public key', function () {
		const bitcoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.bitcoin)
		const publicKey = bitcoinHdNode.derivePath('m/44\'/0\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const bitcoin = new CoinLib.BitcoinProtocol()
		assert.equal(bitcoin.getAddressFromPublicKey(publicKey), '15B2gX2x1eqFKgR44nCe1i33ursGKP4Qpi')
	})
	it('should return the correct litecoin address from public key', function () {
		const litecoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.litecoin)
		const publicKey = litecoinHdNode.derivePath('m/44\'/2\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const litecoin = new CoinLib.LitecoinProtocol()
		assert.equal(litecoin.getAddressFromPublicKey(publicKey), 'LaKxMHETSaWsigMYs88J6ibEGZnLRNWWH1')
	})
	it('should return the correct bitcointestnet address from extended public key', function () {
		const bitcoinTestnetHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.testnet)
		const publicKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const bitcointestnet = new CoinLib.BitcoinTestnetProtocol()
		assert.equal(bitcointestnet.getAddressFromPublicKey(publicKey), 'mi1ypWeso8oAxBxYZ8e2grCNBhW1hrbK8k')
	})
	it('should return the correct zcash address from extended public key', function () {
		const zcashHdNode = zcashJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.zcash)
		const publicKey = zcashHdNode.derivePath('m/44\'/133\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const zcash = new CoinLib.ZCashProtocol()
		assert.equal(zcash.getAddressFromPublicKey(publicKey), 't1PFyZ43MRrVRBWTKqTT5wfimtZ9MFSTgPC')
	})
	it('should return the correct ethereum address from extended public key', function () {
		const bitcoinHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.eth)
		const publicKey = bitcoinHdNode.derivePath('m/44\'/60\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const eth = new CoinLib.EthereumProtocol()
		assert.equal(eth.getAddressFromPublicKey(publicKey), '0x4A1E1D37462a422873BFCCb1e705B05CC4bd922e')
	})
})

describe('Balance Of', function () {
	it('should return the correct bitcointestnet balance', function (done) {
		const bitcoinTestnetHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.testnet)
		const extendedPrivateKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'').toBase58()
		const extendedPublicKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'').neutered().toBase58()
		const bitcointestnet = new CoinLib.BitcoinTestnetProtocol()
		bitcointestnet.getBalanceOfExtendedPublicKey(extendedPublicKey, 0, (error, value) => {
			assert.equal(value, 97499999)
			done()
		})
	})

	it('should return the correct ethereum ropsten balance', function (done) {
		const ethereumRopstenNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.eth)
		const publicKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const ropstenEthereum = new CoinLib.EthereumRopstenProtocol()
		ropstenEthereum.getBalanceOfPublicKey(publicKey, (error, value) => {
			assert.equal(value, '998967812629237855')
			done()
		})
	})

	it('should return the correct hop ropsten balance', function (done) {
		const ethereumRopstenNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.eth)
		const publicKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const hopRopsten = new CoinLib.HOPTokenProtocol()
		hopRopsten.getBalanceOfPublicKey(publicKey, (error, value) => {
			assert.equal(value, '11999999999999999980')
			done()
		})
	})
})

describe('Raw Transaction Prepare', function () {
	it('should return a correct bitcointestnet transaction', function (done) {
		const bitcoinTestnetHdNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, bitcoinJS.networks.testnet)
		const extendedPrivateKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'').toBase58()
		const extendedPublicKey = bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\'').neutered().toBase58()
		const bitcointestnet = new CoinLib.BitcoinTestnetProtocol()
		bitcointestnet.prepareTransactionFromExtendedPublicKey(extendedPublicKey, 0, ['mi1ypWeso8oAxBxYZ8e2grCNBhW1hrbK8k'], [10], 1, function (error, transaction) {
			//let txb = bitcoinJS.TransactionBuilder.fromTransaction(transaction, bitcoinJS.networks.testnet)
			//txb.sign(bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\''), 0)
			bitcointestnet.getTransactionDetails(transaction)
			bitcointestnet.signWithExtendedPrivateKey(extendedPrivateKey, transaction, (err, rawTransaction) => {
				console.log(rawTransaction)
        /*bitcointestnet.broadcastTransaction(rawTransaction, (err, hash) => {
          console.log(err, hash)
          done()
        })*/
				done()
			})
		})
	})

	it('should return a correct ethereum ropsten transaction', function (done) {
		const ethereumRopstenNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.eth)
		const publicKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const privateKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').keyPair.d.toBuffer(32)
		const ethereumRopstenProtocol = new CoinLib.EthereumRopstenProtocol()
		ethereumRopstenProtocol.prepareTransactionFromPublicKey(publicKey, ['0x41d9c9996Ca6De4B759deC24B09EF638c94166e8'], [10], 21000 * 10 ** 9, function (error, transaction) {
			//let txb = bitcoinJS.TransactionBuilder.fromTransaction(transaction, bitcoinJS.networks.testnet)
			//txb.sign(bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\''), 0)
			ethereumRopstenProtocol.getTransactionDetails(transaction)
			ethereumRopstenProtocol.signWithPrivateKey(privateKey, transaction, (err, rawTransaction) => {
				console.log(rawTransaction)
        /*ethereumRopstenProtocol.broadcastTransaction(rawTransaction, (err, hash) => {
          console.log(err, hash)
          done()
        })*/
				done()
			})
		})
	})

	it('should return a correct hop ropsten transaction', function (done) {
		const ethereumRopstenNode = bitcoinJS.HDNode.fromSeedBuffer(masterSeed, networks.networks.eth)
		const publicKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').neutered().getPublicKeyBuffer()
		const privateKey = ethereumRopstenNode.derivePath('m/44\'/60\'/0\'/0/0').keyPair.d.toBuffer(32)
		const hopTokenProtocol = new CoinLib.HOPTokenProtocol()
		hopTokenProtocol.prepareTransactionFromPublicKey(publicKey, ['0x41d9c9996Ca6De4B759deC24B09EF638c94166e8'], [10], 21000 * 10 ** 9, function (error, transaction) {
			//let txb = bitcoinJS.TransactionBuilder.fromTransaction(transaction, bitcoinJS.networks.testnet)
			//txb.sign(bitcoinTestnetHdNode.derivePath('m/44\'/1\'/0\''), 0)
			hopTokenProtocol.getTransactionDetails(transaction)
			hopTokenProtocol.signWithPrivateKey(privateKey, transaction, (err, rawTransaction) => {
				console.log(rawTransaction)
        /*hopTokenProtocol.broadcastTransaction(rawTransaction, (err, hash) => {
          console.log(err, hash)
          done()
        })*/
				done()
			})
		})
	})
})