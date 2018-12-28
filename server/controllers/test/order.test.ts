import * as chai from "chai";
import { SDK } from "codechain-sdk";
import { Server } from "../../../app";
import * as Config from "../../config/dex.json";
import db from "../../models";
import { controllers } from "../index";

const expect = chai.expect;

describe("Order matching basic test", () => {
  it("Matching when amount is same", async () => {
    const sdk = new SDK({
      server: process.env.CODECHAIN_RPC_HTTP || Server.chain,
      networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
    });

    const ACCOUNT_ADDRESS =
      process.env.ACCOUNT_ADDRESS ||
      "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
    const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

    await (async () => {
      const aliceAddress = await sdk.key.createAssetTransferAddress();
      const bobAddress = await sdk.key.createAssetTransferAddress();

      const goldAssetScheme = sdk.core.createAssetScheme({
        shardId: 0,
        metadata: JSON.stringify({
          name: "DEX test",
          description: "DEX test asset",
          icon_url:
            "https://cdn.shopify.com/s/files/1/0010/9215/7503/t/10/assets/cbt2/images/result-clipboard.png?11678745080217472983"
        }),
        amount: 10000,
        approver: null
      });
      const goldMintTx = sdk.core.createAssetMintTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
      });
      const goldMintParcel = sdk.core.createAssetTransactionParcel({
        transaction: goldMintTx
      });
      await sdk.rpc.chain.sendParcel(goldMintParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const goldMintTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        goldMintTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!goldMintTxInvoices[0].success) {
        throw Error(
          `AssetMintTransaction failed: ${JSON.stringify(
            goldMintTxInvoices[0].error
          )}`
        );
      }

      const silverAssetScheme = sdk.core.createAssetScheme({
        shardId: 0,
        metadata: JSON.stringify({
          name: "Silver",
          description: "An asset example",
          icon_url: "https://silver.image/"
        }),
        amount: 100000,
        approver: null
      });
      const silverMintTx = sdk.core.createAssetMintTransaction({
        scheme: silverAssetScheme,
        recipient: bobAddress
      });
      const silverMintParcel = sdk.core.createAssetTransactionParcel({
        transaction: silverMintTx
      });
      await sdk.rpc.chain.sendParcel(silverMintParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const silverMintTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        silverMintTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!silverMintTxInvoices[0].success) {
        throw Error(
          `AssetMintTransaction failed: ${JSON.stringify(
            silverMintTxInvoices[0].error
          )}`
        );
      }

      const gold = goldMintTx.getMintedAsset();
      const silver = silverMintTx.getMintedAsset();

      const goldInput = gold.createTransferInput();
      const silverInput = silver.createTransferInput();

      const expiration = Math.round(Date.now() / 1000) + 1000;
      const aliceOrder = sdk.core.createOrder({
        assetTypeFrom: gold.assetType,
        assetTypeTo: silver.assetType,
        assetAmountFrom: 100,
        assetAmountTo: 1000,
        expiration,
        originOutputs: [goldInput.prevOut],
        recipientFrom: aliceAddress
      });

      const BobOrder = sdk.core.createOrder({
        assetTypeFrom: silver.assetType,
        assetTypeTo: gold.assetType,
        assetAmountFrom: 1000,
        assetAmountTo: 100,
        expiration,
        originOutputs: [silverInput.prevOut],
        recipientFrom: aliceAddress
      });
      expect(0).to.equal(0);

      const marketTmp1 = Config.market.testMarket.asset1;
      const marketTmp2 = Config.market.testMarket.asset2;
      Config.market.testMarket.asset1 = gold.assetType
        .toEncodeObject()
        .slice(2);
      Config.market.testMarket.asset2 = silver.assetType
        .toEncodeObject()
        .slice(2);

      await sdk.key.signTransactionInputWithOrder(goldInput, aliceOrder);
      await controllers.orderController.submit(
        [goldInput],
        aliceOrder,
        0,
        aliceAddress.toString()
      );

      await sdk.key.signTransactionInputWithOrder(silverInput, BobOrder);
      await controllers.orderController.submit(
        [silverInput],
        BobOrder,
        0,
        bobAddress.toString()
      );

      Config.market.testMarket.asset1 = marketTmp1;
      Config.market.testMarket.asset2 = marketTmp2;
      console.log(aliceOrder, BobOrder);
      console.log(marketTmp1, marketTmp2);
    })().catch(async error => {
      console.error(`Error:`, error);
    });
  }).timeout(20000);

  after(async () => {
    await db.Order.destroy({
      where: { marketId: "0" }
    });
    await db.sequelize.close();
  });
});
