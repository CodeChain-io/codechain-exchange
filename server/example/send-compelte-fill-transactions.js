const SDK = require("codechain-sdk");
const axios = require('axios');

const sdk = new SDK({
    server: "http://127.0.0.1:8080",
    networkId: "tc"
});

const delay = ms => new Promise(res => setTimeout(res, ms));

const ACCOUNT_ADDRESS = "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
const ACCOUNT_SECRET = "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
const FEE_ASSET_TYPE = "0x0000000000000000000000000000000000000000";
const DEX_ASSET_ADDRESS = require("../config/dex.json")["dex-asset-address"].development;


const shardId = 0;
(async () => {
    const aliceAddress = await sdk.key.createAssetAddress({
        type: "P2PKH"
    });
    const bobAddress = await sdk.key.createAssetAddress({
        type: "P2PKH"
    });

    // Mint gold asset for Alice
    const goldAssetScheme = sdk.core.createAssetScheme({
        shardId,
        metadata: {
            name: "Gold",
            description: "An asset example",
            icon_url: "https://gold.image/"
        },
        supply: 10000,
        registrar: null
    });
    const goldMintTx = sdk.core.createMintAssetTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
    });
    let seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
    await sdk.rpc.chain.sendSignedTransaction(
        goldMintTx.sign({
            secret: ACCOUNT_SECRET,
            fee: 100000,
            seq
        })
    );
    console.log("Send gold mint")
    let transferTxResults = await sdk.rpc.chain.getTransactionResultsByTracker(
        goldMintTx.tracker(), {
            timeout: 300 * 1000
        }
    );
    if (!transferTxResults[0]) {
        throw Error(
            `GoldMintTransaction failed: ${JSON.stringify(transferTxResults[0])}`
        );
    }
    const gold = goldMintTx.getMintedAsset();

    // Mint silver asset for Bob
    const silverAssetScheme = sdk.core.createAssetScheme({
        shardId,
        metadata: {
            name: "Silver",
            description: "An asset example",
            icon_url: "https://silver.image/"
        },
        supply: 100000,
        registrar: null
    });
    const silverMintTx = sdk.core.createMintAssetTransaction({
        scheme: silverAssetScheme,
        recipient: bobAddress
    });
    seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
    await sdk.rpc.chain.sendSignedTransaction(
        silverMintTx.sign({
            secret: ACCOUNT_SECRET,
            fee: 100000,
            seq
        })
    );
    console.log("Send silver mint")
    transferTxResults = await sdk.rpc.chain.getTransactionResultsByTracker(
        silverMintTx.tracker(), {
            timeout: 300 * 1000
        }
    );
    if (!transferTxResults[0]) {
        throw Error(
            `SilverMintTransaction failed: ${JSON.stringify(transferTxResults[0])}`
        );
    }
    const silver = silverMintTx.getMintedAsset();

    // Wrap 1000 CCC into the Wrapped CCC asset type and send to bob.
    const wrapCCC = sdk.core.createWrapCCCTransaction({
        shardId: 0,
        recipient: bobAddress,
        quantity: 1000,
        payer: ACCOUNT_ADDRESS
    });
    seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
    await sdk.rpc.chain.sendSignedTransaction(
        wrapCCC.sign({
            secret: ACCOUNT_SECRET,
            fee: 100000,
            seq
        })
    );
    console.log("wCCC mint")
    const wccc = wrapCCC.getAsset();


    const goldInput = gold.createTransferInput();
    const silverInput = silver.createTransferInput();
    const wcccInput = wccc.createTransferInput();

    const expiration = Math.round(Date.now() / 1000) + 120;
    // Order for Alice
    const orderA = sdk.core.createOrder({
        assetTypeFrom: gold.assetType,
        assetTypeTo: silver.assetType,
        shardIdFrom: shardId,
        shardIdTo: shardId,
        assetQuantityFrom: 10,
        assetQuantityTo: 100,
        expiration,
        originOutputs: [goldInput.prevOut],
        recipientFrom: aliceAddress
    });
    await sdk.key.signTransactionInputWithOrder(goldInput, orderA);

    // Order for Bob
    const orderB = sdk.core.createOrder({
        assetTypeFrom: silver.assetType,
        assetTypeTo: gold.assetType,
        assetTypeFee: FEE_ASSET_TYPE,
        shardIdFrom: shardId,
        shardIdTo: shardId,
        shardIdFee: shardId,
        assetQuantityFrom: 100,
        assetQuantityTo: 10,
        assetQuantityFee: 100,
        expiration,
        originOutputs: [silverInput.prevOut, wcccInput.prevOut],
        recipientFrom: bobAddress,
        recipientFee: DEX_ASSET_ADDRESS
    });
    await sdk.key.signTransactionInputWithOrder(silverInput, orderB);
    await sdk.key.signTransactionInputWithOrder(wcccInput, orderB);

    // send post request
    await axios.post('http://localhost:8448/api/orders', {
            assetList: [goldInput],
            order: orderA,
            makerAddress: aliceAddress.toString(),
            splitTx: null
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
    await delay(1000)

    await axios.post('http://localhost:8448/api/orders', {
            assetList: [silverInput, wcccInput],
            order: orderB,
            makerAddress: bobAddress.toString(),
            splitTx: null
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
})().catch(console.error)
