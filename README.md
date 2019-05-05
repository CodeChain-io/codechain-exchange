# CodeChain Exchange

Decentralized exchange platform for an asset on the CodeChain

## Getting Started

## Download CodeChain exchange code

```
# git clone https://github.com/CodeChain-io/codechain-exchange.git
# cp codechain-exchange
```

## Prerequisites

```
# yarn install
# sudo service postgresql start
# yarn migration
```

### Account setting
Before All, you need to set a fee recipient asset address in the `/server/config/dex.json`
#### Development mode
Matched transactions are signed by secret. You don't actually need to do nothing
#### Test mode
Matched transactions are singed by secret. You need to add platform and its secret into the `/server/config/dex.json`
#### Production mode
Matched transactions are signed with the local keystore `/server/config/keystore.db`. The local keystore should store only one key.

## Start server

```
# yarn start
```

## Start server in develop mode

```
# yarn start-dev
```

## Start client (Not implemented)

```
# cd client
# yarn serve
```

## Running the tests

```
# yarn test
```

## Deployment

## DB migration and undo migration

```
# yarn migration
# yarn undo-migration
```

## Insert seed data into DB

```
# yarn seed
# yarn undo-seed
```

## Formatting

```
# yarn fmt
```

## Market ID
In development and test environment, market ID of transaction is `0`.
s far as market ID is `0`, the engine does not apply market rules on the transactions.
On the other hand, in production mode, all the transactions have to meet the market rules

## dex.json
__structure__
```json
{
  "dex-asset-address": {
    "production": "",
    "test": "",
    "development": ""
  },
  "dex-passphrase": "",
  "fee-rate": ,
  "fee-asset-type": "0x0000000000000000000000000000000000000000",
  "test-account": "",
  "test-secret": "",
  "market": {
    "testMarket": {
      "id": 0,
      "asset1": "0x",
      "asset2": "0x"
    }
  },
  "node": {
    "production": {
      "rpc": "https://rpc.codechain.io/",
      "network-id": "cc"
    },
    "test": {
      "rpc": "https://corgi-rpc.codechain.io",
      "network-id": "wc"
    },
    "development": {
      "rpc": "http://127.0.0.1:8080",
      "network-id": "tc"
    }
  }
}

```
