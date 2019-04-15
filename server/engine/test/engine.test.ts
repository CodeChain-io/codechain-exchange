import * as chai from "chai";
import { H160 } from "codechain-primitives";

import { SDK } from "codechain-sdk";
import { Server } from "../../../app";
import * as Config from "../../config/dex.json";
import { controllers } from "../../controllers";
import db from "../../models";
import { submit } from "../matching";

const expect = chai.expect;
const DEX_ADDRESS = Config["dex-platform-address"];
const DEX_PASSPHRASE = Config["dex-passphrase"];
const FEE_ASSET_TYPE = Config["fee-asset-type"];

describe("Order matching basic test", () => {
    let sdk: SDK;

    before(async () => {
        sdk = new SDK({
            server: Server,
            networkId: "tc"
        });
    });

    it("Complete fill matching", async () => {
        await (async () => {
            const shardId = 0;
            const aliceAddress = await sdk.key.createAssetAddress({ type: "P2PKH" });
            const bobAddress = await sdk.key.createAssetAddress({ type: "P2PKH" });

            // Wrap 1000 CCC into the Wrapped CCC asset type and send to bob.
            const wrapCCC = sdk.core.createWrapCCCTransaction({
                shardId: 0,
                recipient: bobAddress,
                quantity: 1000,
                payer: DEX_ADDRESS
            });
            const hash = await sdk.rpc.chain.sendTransaction(wrapCCC, {
                account: DEX_ADDRESS,
                passphrase: DEX_PASSPHRASE
            });
            const result = await sdk.rpc.chain.containsTransaction(hash);
            expect(result).to.equal(true);

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
            await sdk.rpc.chain.sendTransaction(goldMintTx, {
                account: DEX_ADDRESS,
                passphrase: DEX_PASSPHRASE
            });
            const goldMintTxResults = await sdk.rpc.chain.getTransactionResultsByTracker(
                goldMintTx.tracker(),
                {
                    timeout: 300 * 1000
                }
            );
            if (!goldMintTxResults[0]) {
                throw Error(
                    `AssetMintTransaction failed: ${JSON.stringify(goldMintTxResults[0])}`
                );
            }

            const gold = goldMintTx.getMintedAsset();
            const goldInput = gold.createTransferInput();

            const wccc = wrapCCC.getAsset();
            const wcccInput = wccc.createTransferInput();

            const expiration = Math.round(Date.now() / 1000) + 120;
            // Order for Alice
            const orderA = sdk.core.createOrder({
                assetTypeFrom: gold.assetType,
                assetTypeTo: new H160(FEE_ASSET_TYPE),
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
                assetTypeFrom: wccc.assetType,
                assetTypeTo: gold.assetType,
                assetTypeFee: new H160(FEE_ASSET_TYPE),
                shardIdFrom: shardId,
                shardIdTo: shardId,
                assetQuantityFrom: 100,
                assetQuantityTo: 10,
                assetQuantityFee: 100,
                expiration,
                originOutputs: [wcccInput.prevOut],
                recipientFrom: bobAddress
            });
            await sdk.key.signTransactionInputWithOrder(wcccInput, orderB);

            await submit([goldInput], orderA, aliceAddress.toString(), null);
            await submit([wcccInput], orderB, bobAddress.toString(), null);

            const relayedOrder = await controllers.orderController.find(
                gold.assetType.toJSON(),
                FEE_ASSET_TYPE,
                null,
                null,
                aliceAddress.toString()
            );
            expect(relayedOrder.length).to.equal(0);
        })().catch(async error => {
            console.error(`Error:`, error);
        });
    }).timeout(20000);

    it("No matching order", async () => {
        await (async () => {
            const shardId = 0;
            const aliceAddress = await sdk.key.createAssetAddress();

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
            const gold = goldMintTx.getMintedAsset();
            const goldInput = gold.createTransferInput();
            // Order is valid for 120 seconds
            const expiration = Math.round(Date.now() / 1000) + 120;
            const order = sdk.core.createOrder({
                assetTypeFrom: gold.assetType,
                assetTypeTo: new H160(FEE_ASSET_TYPE),
                shardIdFrom: shardId,
                shardIdTo: shardId,
                assetQuantityFrom: 10,
                assetQuantityTo: 100,
                expiration,
                originOutputs: [goldInput.prevOut],
                recipientFrom: aliceAddress
            });
            await sdk.key.signTransactionInputWithOrder(goldInput, order);

            await sdk.rpc.chain.sendTransaction(goldMintTx, {
                account: DEX_ADDRESS,
                passphrase: DEX_PASSPHRASE
            });

            const goldMintTxResults = await sdk.rpc.chain.getTransactionResultsByTracker(
                goldMintTx.tracker(),
                {
                    timeout: 300 * 1000
                }
            );
            if (!goldMintTxResults[0]) {
                throw Error(
                    `AssetMintTransaction failed: ${JSON.stringify(goldMintTxResults[0])}`
                );
            }

            await submit([goldInput], order, aliceAddress.toString(), null);

            const relayedOrder = await controllers.orderController.find(
                gold.assetType.toJSON(),
                FEE_ASSET_TYPE,
                null,
                null,
                aliceAddress.toString()
            );
            expect(relayedOrder.length).to.equal(1);

            await controllers.orderController.destroy(relayedOrder[0].get("id"));
        })().catch(async error => {
            console.error(`Error:`, error);
        });
    }).timeout(20000);

    after(async () => {
        await db.sequelize.close();
    });
});
