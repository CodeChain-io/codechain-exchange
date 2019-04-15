import * as chai from "chai";
import { H160 } from "codechain-primitives";

import { SDK } from "codechain-sdk";
import { Server } from "../../../app";
import * as Config from "../../config/dex.json";
import { controllers } from "../../controllers";
import db from "../../models";
import { submit } from "../matching";

const expect = chai.expect;

describe("Order matching basic test", () => {
    let sdk: SDK;

    before(async () => {
        sdk = new SDK({
            server: Server,
            networkId: "tc"
        });
    });

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
                assetTypeTo: new H160(Config["fee-asset-type"]),
                shardIdFrom: shardId,
                shardIdTo: shardId,
                assetQuantityFrom: 100,
                assetQuantityTo: 1000,
                assetQuantityFee: 200,
                expiration,
                originOutputs: [goldInput.prevOut],
                recipientFrom: aliceAddress
            });
            await sdk.key.signTransactionInputWithOrder(goldInput, order);

            await submit([goldInput], order, aliceAddress.toString(), null);

            const relayedOrder = await controllers.orderController.find(
                gold.assetType.toJSON(),
                Config["fee-asset-type"],
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
