const BIP39 = require('bip39')
const assert = require('assert')
const networks = require('./networks.js')

const bitcoinJS = require('bitcoinjs-lib')
const zcashJS = require('bitcoinjs-lib-zcash')
const request = require('request')

const Web3 = require('web3')
const BigNumber = require('bignumber.js')
const ethUtil = require('ethereumjs-util')
const EthereumTransaction = require('ethereumjs-tx')

const mnemonicPhrase = 'spell device they juice trial skirt amazing boat badge steak usage february virus art survey' // this is what the user writes down and what is saved by secure storage?
const masterSeed = BIP39.mnemonicToSeed(mnemonicPhrase)

const CoinLib = {};

class CoinProtocol {
  getAddressFromPublicKey(publicKey) { // broadcaster knows this (both broadcaster and signer)
  }

  getAddressFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressDerivationIndex) { // broadcaster knows this (both broadcaster and signer)
  }

  getAddressesFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressCount, offset) { // broadcaster knows this (both broadcaster and signer)
  }

  signWithExtendedPrivateKey(extendedPrivateKey, transaction, callback) { // broadcaster proxies this operation
  }

  signWithPrivateKey(extendedPrivateKey, transaction, callback) { // broadcaster proxies this operation
  }

  getTransactionDetails(transaction) { // out of public information (both broadcaster and signer)
  }

  getBalanceOfPublicKey(publicKey, callback) {
  }

  getBalanceOfExtendedPublicKey(extendedPublicKey, offset = 0, callback) {
  }

  prepareTransactionFromExtendedPublicKey(extendedPublicKey, offset, recipients, values, fee, callback) { // only broadcaster
  }

  prepareTransactionFromPublicKey(publicKey, recipients, values, fee, callback) { // only broadcaster
  }

  broadcastTransaction(rawTransaction, callback) {
  }
}

class BitcoinProtocol extends CoinProtocol {
  constructor(network = bitcoinJS.networks.bitcoin, baseApiUrl = 'https://insight.bitpay.com', bitcoinJSLib = bitcoinJS) {
    super()
    this.network = network
    this.baseApiUrl = baseApiUrl
    this.bitcoinJSLib = bitcoinJSLib
  }

  getAddressFromPublicKey(publicKey) { // broadcaster knows this (both broadcaster and signer)
    return this.bitcoinJSLib.ECPair.fromPublicKeyBuffer(publicKey, this.network).getAddress()
  }

  getAddressFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressDerivationIndex) { // broadcaster knows this (both broadcaster and signer)
    return this.bitcoinJSLib.HDNode.fromBase58(extendedPublicKey, this.network).derive(visibilityDerivationIndex).derive(addressDerivationIndex).getAddress()
  }

  getAddressesFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressCount, offset) { // broadcaster knows this (both broadcaster and signer)
    const node = this.bitcoinJSLib.HDNode.fromBase58(extendedPublicKey, this.network)
    const generatorArray = Array.from(new Array(addressCount), (x, i) => i + offset)
    return generatorArray.map(x => node.derive(visibilityDerivationIndex).derive(x).getAddress())
  }

  signWithPrivateKey(privateKey, transaction, callback) { // broadcaster proxies this operation
    const transactionBuilder = new this.bitcoinJSLib.TransactionBuilder(this.network)
    for (let input of transaction.ins) {
      transactionBuilder.addInput(input.txId, input.vout)
    }

    for (let output of transaction.outs) {
      transactionBuilder.addOutput(output.recipient, output.value)
    }

    for (let i = 0; i < transaction.ins.length; i++) {
      transactionBuilder.sign(i, privateKey)
    }
    callback(undefined, transactionBuilder.build().toHex())
  }

  signWithExtendedPrivateKey(extendedPrivateKey, transaction, callback) { // broadcaster proxies this operation
    const transactionBuilder = new this.bitcoinJSLib.TransactionBuilder(this.network)
    const node = this.bitcoinJSLib.HDNode.fromBase58(extendedPrivateKey, this.network)

    for (let input of transaction.ins) {
      transactionBuilder.addInput(input.txId, input.vout)
    }

    for (let output of transaction.outs) {
      transactionBuilder.addOutput(output.recipient, output.value)
    }

    for (let i = 0; i < transaction.ins.length; i++) {
      transactionBuilder.sign(i, node.derivePath(transaction.ins[i].derivationPath))
    }
    callback(undefined, transactionBuilder.build().toHex())
  }

  getTransactionDetails(transaction) { // out of public information (both broadcaster and signer)
    console.log('---- New Transaction ----')
    let feeCalculator = 0
    for (let txIn of transaction.ins) {
      console.log('In:\t\t\t\t' + txIn.value)
      feeCalculator += txIn.value
    }

    for (let txOut of transaction.outs) {
      console.log('Out:\t\t\t' + txOut.value)
      feeCalculator -= txOut.value
    }
    console.log('Fee:\t\t\t' + feeCalculator)
  }

  getBalanceOfPublicKey(publicKey, callback) {
    const address = this.getAddressFromPublicKey(publicKey)
    request.get(this.baseApiUrl + '/api/addrs/' + address + '/utxo', (error, response, body) => {
      const utxos = JSON.parse(body)
      if (error) {
        callback(error)
      } else {
        let valueAccumulator = 0
        for (let utxo of utxos) {
          valueAccumulator += utxo.satoshis
        }
        callback(undefined, valueAccumulator)
      }
    })
  }

  getBalanceOfExtendedPublicKey(extendedPublicKey, offset = 0, callback) {
    const derivedAddresses = []
    const internalAddresses = this.getAddressesFromExtendedPublicKey(extendedPublicKey, 1, 20, offset)
    const externalAddresses = this.getAddressesFromExtendedPublicKey(extendedPublicKey, 0, 20, offset)
    derivedAddresses.push(internalAddresses) // we don't add the last one
    derivedAddresses.push(externalAddresses) // we don't add the last one to make change address possible
    request.get(this.baseApiUrl + '/api/addrs/' + derivedAddresses.join(',') + '/utxo', (error, response, body) => {
      const utxos = JSON.parse(body)
      if (error) {
        callback(error)
      } else {
        let valueAccumulator = 0
        for (let utxo of utxos) {
          valueAccumulator += utxo.satoshis
        }

        request.get(this.baseApiUrl + '/api/addrs/' + derivedAddresses.join(',') + '/txs?from=0&to=1', (error, response, body) => {
          const transactions = JSON.parse(body)
          if (transactions.items.length > 0) {
            this.getBalanceOfExtendedPublicKey(extendedPublicKey, offset + 100, (error, value) => {
              callback(error, valueAccumulator + value)
            })
          } else {
            callback(undefined, valueAccumulator) // no transactions found on those addresses, probably won't find anything in the next ones
          }
        })
      }
    })
  }

  prepareTransactionFromExtendedPublicKey(extendedPublicKey, offset, recipients, values, fee, callback) { // only broadcaster
    const transaction = {
      ins: [],
      outs: []
    }
    assert(recipients.length === values.length)
    const derivedAddresses = []
    const internalAddresses = this.getAddressesFromExtendedPublicKey(extendedPublicKey, 1, 101, offset)
    const externalAddresses = this.getAddressesFromExtendedPublicKey(extendedPublicKey, 0, 101, offset)
    derivedAddresses.push(...internalAddresses.slice(0, -1)) // we don't add the last one
    derivedAddresses.push(...externalAddresses.slice(0, -1)) // we don't add the last one to make change address possible

    request.get(this.baseApiUrl + '/api/addrs/' + derivedAddresses.join(',') + '/utxo', (error, response, body) => {
      const utxos = JSON.parse(body)
      if (error) {
        callback(error)
      } else {
        const totalRequiredBalance = values.reduce((accumulator, currentValue) => accumulator + currentValue) + fee
        let valueAccumulator = 0
        for (let utxo of utxos) {
          valueAccumulator += utxo.satoshis
          if (derivedAddresses.indexOf(utxo.address) >= 0) {
            transaction.ins.push({
              txId: utxo.txid,
              value: utxo.satoshis,
              vout: utxo.vout,
              address: utxo.address,
              derivationPath: externalAddresses.indexOf(utxo.address) >= 0 ? '0/' + (externalAddresses.indexOf(utxo.address) + offset) : '1/' + (internalAddresses.indexOf(utxo.address) + offset)
            })
          }
          //tx.addInput(utxo.txid, utxo.vout)
          if (valueAccumulator >= totalRequiredBalance) {
            for (let i = 0; i < recipients.length; i++) {
              transaction.outs.push({
                recipient: recipients[i],
                value: values[i]
              })
              valueAccumulator -= values[i]
              //tx.addOutput(recipients[i], values[i])
            }
            request.get(this.baseApiUrl + '/api/addrs/' + internalAddresses.join(',') + '/txs', (error, response, body) => {
              const transactions = JSON.parse(body)
              let maxIndex = -1
              for (let transaction of transactions.items) {
                for (let vout of transaction.vout) {
                  for (let address of vout.scriptPubKey.addresses) {
                    maxIndex = Math.max(maxIndex, internalAddresses.indexOf(address))
                  }
                }
              }
              transaction.outs.push({
                recipient: internalAddresses[maxIndex + 1],
                value: valueAccumulator - fee
              })
              //tx.addOutput(internalAddresses[maxIndex + 1], valueAccumulator - fee) //this is why we sliced the arrays earlier
              callback(undefined, transaction)
            })
            break
          }
        }
        if (valueAccumulator < totalRequiredBalance) {
          request.get(this.baseApiUrl + '/api/addrs/' + internalAddresses.join(',') + '/txs?from=0&to=1', (error, response, body) => {
            const transactions = JSON.parse(body)
            if (transactions.items.length > 0) {
              return this.prepareTransactionFromExtendedPublicKey(extendedPublicKey, offset + 10, recipients, values, fee, callback) // recursion needed to navigate through HD wallet
            } else {
              callback('not enough balance') // no transactions found on those addresses, probably won't find anything in the next ones
            }
          })
        }
      }
    })
  }

  prepareTransactionFromPublicKey(publicKey, recipients, values, fee, callback) { // only broadcaster
    const transaction = {
      ins: [],
      outs: []
    }
    assert(recipients.length === values.length)
    const address = this.getAddressFromPublicKey(publicKey)
    request.get(this.baseApiUrl + '/api/addrs/' + address + '/utxo', (error, response, body) => {
      const utxos = JSON.parse(body)
      if (error) {
        callback(error)
      } else {
        const totalRequiredBalance = values.reduce((accumulator, currentValue) => accumulator + currentValue) + fee
        let valueAccumulator = 0
        for (let utxo of utxos) {
          valueAccumulator += utxo.satoshis
          if (address === utxo.address) {
            transaction.ins.push({
              txId: utxo.txid,
              value: utxo.satoshis,
              vout: utxo.vout,
              address: utxo.address
            })
          }
          //tx.addInput(utxo.txid, utxo.vout)
          if (valueAccumulator >= totalRequiredBalance) {
            for (let i = 0; i < recipients.length; i++) {
              transaction.outs.push({
                recipient: recipients[i],
                value: values[i]
              })
              valueAccumulator -= values[i]
              //tx.addOutput(recipients[i], values[i])
            }

            transaction.outs.push({
              recipient: address,
              value: valueAccumulator - fee
            })
            callback(undefined, transaction)
          } else {
            callback('not enough balance')
          }
        }
      }
    })
  }

  broadcastTransaction(rawTransaction, callback) {
    request.post(this.baseApiUrl + '/api/tx/send', { form: { rawtx: rawTransaction } }, (error, response, body) => {
      try {
        const payload = JSON.parse(body)
        if (error) {
          callback(error)
        } else {
          callback(undefined, payload.txid)
        }
      } catch (err) {
        callback(body)
      }
    })
  }
}

class BitcoinTestnetProtocol extends BitcoinProtocol {
  constructor() {
    super(bitcoinJS.networks.testnet, 'https://test-insight.bitpay.com')
  }
}

class LitecoinProtocol extends BitcoinProtocol {
  constructor() {
    super(bitcoinJS.networks.litecoin, 'https://insight.litecore.io')
  }
}

class ZCashProtocol extends BitcoinProtocol {
  constructor() {
    super(networks.networks.zcash, 'https://explorer.zcashfr.io', zcashJS)
  }
}

class ZCashTestnetProtocol extends BitcoinProtocol {
  constructor() {
    super(networks.networks.zcash, 'https://explorer.testnet.z.cash', zcashJS) // we probably need another network here, explorer is ok
  }
}

class EthereumProtocol extends CoinProtocol {
  constructor(apiUrl = 'https://mainnet.infura.io/', chainId = 1) {
    super()
    this.web3 = new Web3(new Web3.providers.HttpProvider(apiUrl))
    this.network = bitcoinJS.networks.bitcoin
    this.chainId = chainId
  }

  getAddressFromPublicKey(publicKeyBuffer) { // broadcaster knows this (both broadcaster and signer)
    return ethUtil.toChecksumAddress(ethUtil.publicToAddress(publicKeyBuffer, true).toString('hex'))
  }

  getAddressFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressDerivationIndex) { // broadcaster knows this (both broadcaster and signer)
    return this.getAddressFromPublicKey(bitcoinJS.HDNode.fromBase58(extendedPublicKey, this.network).derive(visibilityDerivationIndex).derive(addressDerivationIndex).getPublicKeyBuffer())
  }

  getAddressesFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressCount, offset) { // broadcaster knows this (both broadcaster and signer)
    const node = bitcoinJS.HDNode.fromBase58(extendedPublicKey, this.network)
    const generatorArray = Array.from(new Array(addressCount), (x, i) => i + offset)
    return generatorArray.map(x => this.getAddressFromPublicKey(node.derive(visibilityDerivationIndex).derive(x).getPublicKeyBuffer()))
  }

  signWithExtendedPrivateKey(extendedPrivateKey, transaction, callback) { // broadcaster proxies this operation
    callback('extended private key signing for ether not implemented')
  }

  signWithPrivateKey(privateKey, transaction, callback) { // broadcaster proxies this operation
    assert(transaction.from === ethUtil.toChecksumAddress(ethUtil.privateToAddress(privateKey).toString('hex')))

    const txParams = {
      nonce: this.web3.utils.toHex(transaction.nonce),
      gasPrice: this.web3.utils.toHex(transaction.gasPrice),
      gasLimit: this.web3.utils.toHex(transaction.gasLimit),
      to: transaction.to,
      value: this.web3.utils.toHex(new BigNumber(transaction.value)),
      chainId: this.web3.utils.toHex(this.chainId)
    }

    const tx = new EthereumTransaction(txParams)
    tx.sign(privateKey)
    callback(undefined, tx.serialize().toString('hex'))
  }

  getTransactionDetails(transaction) { // out of public information (both broadcaster and signer)
    console.log('---- New Transaction ----')
    console.log('Sender:\t\t\t' + transaction.from)
    console.log('Recipient:\t\t' + transaction.to)
    console.log('Value:\t\t\t' + transaction.value)
    console.log('Fee:\t\t\t' + transaction.gasLimit * transaction.gasPrice)
  }

  getBalanceOfPublicKey(publicKey, callback) {
    const address = this.getAddressFromPublicKey(publicKey)
    this.web3.eth.getBalance(address, callback)
  }

  getBalanceOfExtendedPublicKey(extendedPublicKey, offset = 0, callback) {
    callback('extended public balance for ether not implemented')
  }

  prepareTransactionFromExtendedPublicKey(extendedPublicKey, offset, recipients, values, fee, callback) { // only broadcaster
    callback('extended public tx for ether not implemented')
  }

  prepareTransactionFromPublicKey(publicKey, recipients, values, fee, callback) { // only broadcaster
    assert(recipients.length === values.length)
    assert(recipients.length === 1)

    this.getBalanceOfPublicKey(publicKey, (error, balance) => {
      const gasLimit = 21000
      const gasPrice = Math.ceil(fee / gasLimit)
      if (new BigNumber(balance).gte(new BigNumber(values[0] + fee))) {
        const address = this.getAddressFromPublicKey(publicKey)
        this.web3.eth.getTransactionCount(address).then(txCount => {

          const transaction = {
            nonce: txCount,
            gasLimit: gasLimit,
            gasPrice: gasPrice, // 10 Gwei
            to: recipients[0],
            from: address,
            value: values[0],
            chainId: this.chainId
          }
          callback(undefined, transaction)
        })
      } else {
        callback('not enough balance')
      }
    })
  }

  broadcastTransaction(rawTransaction, callback) {
    this.web3.eth.sendSignedTransaction('0x' + rawTransaction, (err, receipt) => {
      if (err) {
        callback(err)
      } else {
        callback(err, receipt.transactionHash)
      }
    })
  }
}

class EthereumRopstenProtocol extends EthereumProtocol {
  constructor() {
    super('https://ropsten.infura.io/', 3) // we probably need another network here, explorer is ok
  }
}

class EthereumClassicProtocol extends EthereumProtocol {
  constructor() {
    super('https://mew.epool.io/', 61) // we probably need another network here, explorer is ok
  }
}

const AUTH_TOKEN_ABI = [
  {
    'constant': true,
    'inputs': [
      {
        'name': '_owner',
        'type': 'address'
      }
    ],
    'name': 'balanceOf',
    'outputs': [
      {
        'name': 'balance',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': '_to',
        'type': 'address'
      },
      {
        'name': '_value',
        'type': 'uint256'
      }
    ],
    'name': 'transfer',
    'outputs': [
      {
        'name': 'success',
        'type': 'bool'
      }
    ],
    'payable': false,
    'type': 'function'
  }
]

class GenericERC20 extends EthereumProtocol {

  constructor(apiUrl = 'https://mainnet.infura.io/', chainId = 1, contractAddress) {
    super(apiUrl, chainId) // we probably need another network here, explorer is ok
    this.tokenContract = new this.web3.eth.Contract(AUTH_TOKEN_ABI, contractAddress)
  }

  getBalanceOfPublicKey(publicKey, callback) {
    const address = this.getAddressFromPublicKey(publicKey)
    this.tokenContract.methods.balanceOf(address).call(callback)
  }

  signWithPrivateKey(privateKey, transaction, callback) { // broadcaster proxies this operation
    assert(transaction.from === ethUtil.toChecksumAddress(ethUtil.privateToAddress(privateKey).toString('hex')))

    const txParams = {
      nonce: this.web3.utils.toHex(transaction.nonce),
      gasPrice: this.web3.utils.toHex(transaction.gasPrice),
      gasLimit: this.web3.utils.toHex(transaction.gasLimit),
      to: this.tokenContract.options.address,
      data: this.tokenContract.methods.transfer(transaction.to, transaction.value).encodeABI(),
      chainId: this.web3.utils.toHex(this.chainId)
    }

    const tx = new EthereumTransaction(txParams)
    tx.sign(privateKey)
    callback(undefined, tx.serialize().toString('hex'))
  }

  prepareTransactionFromPublicKey(publicKey, recipients, values, fee, callback) { // only broadcaster
    assert(recipients.length === values.length)
    assert(recipients.length === 1)
    this.getBalanceOfPublicKey(publicKey, (error, balance) => {
      if (balance >= values[0]) {
        super.getBalanceOfPublicKey(publicKey, (error, ethBalance) => {
          const address = this.getAddressFromPublicKey(publicKey)
          this.tokenContract.methods.transfer(recipients[0], values[0]).estimateGas({ from: address }, (error, gasAmount) => {
            const gasLimit = gasAmount + 21000 // unsure about this calculation
            if (ethBalance >= fee) {
              this.web3.eth.getTransactionCount(address).then(txCount => {
                const transaction = {
                  nonce: txCount,
                  gasLimit: gasLimit,
                  gasPrice: Math.ceil(fee / gasAmount),
                  to: recipients[0],
                  from: address,
                  value: values[0],
                  chainId: this.chainId
                }
                callback(undefined, transaction)
              })
            } else {
              callback('not enough ETH balance')
            }
          })
        })
      } else {
        callback('not enough token balance')
      }
    })
  }
}

class HOPTokenProtocol extends GenericERC20 {
  constructor() {
    super('https://ropsten.infura.io/', 3, '0x2dd847af80418D280B7078888B6A6133083001C9') // we probably need another network here, explorer is ok
  }
}

CoinLib.BitcoinProtocol = BitcoinProtocol;
CoinLib.BitcoinTestnetProtocol = BitcoinTestnetProtocol;
CoinLib.LitecoinProtocol = LitecoinProtocol
CoinLib.ZCashProtocol = ZCashProtocol
CoinLib.ZCashTestnetProtocol = ZCashTestnetProtocol
CoinLib.EthereumProtocol = EthereumProtocol
CoinLib.EthereumRopstenProtocol = EthereumRopstenProtocol
CoinLib.EthereumClassicProtocol = EthereumClassicProtocol
CoinLib.GenericERC20 = GenericERC20
CoinLib.HOPTokenProtocol = HOPTokenProtocol

module.exports = CoinLib;
