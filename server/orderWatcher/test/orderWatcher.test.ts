import { H256 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
import { Server } from "../../../app";
import { controllers } from "../../controllers";
import db from "../../models";
import { OrderWatcher } from "../orderWatcher";

import * as chai from "chai";

const expect = chai.expect;

// To execute test, change orderWatcher's target node to localhost
describe("OrderWatcher basic test", () => {
  const sdk = new SDK({
    server: process.env.CODECHAIN_RPC_HTTP || Server.chain,
    networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
  });
  const orderWatcher = new OrderWatcher();
  before(() => {
    orderWatcher.run();
  });

  it("Invalid order check test", async () => {
    const ACCOUNT_ADDRESS =
      process.env.ACCOUNT_ADDRESS ||
      "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
    const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

    await (async () => {
      const aliceAddress = await sdk.key.createAssetTransferAddress();

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
      const mintTx = sdk.core.createAssetMintTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
      });
      const mintParcel = sdk.core.createAssetTransactionParcel({
        transaction: mintTx
      });

      await sdk.rpc.chain.sendParcel(mintParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const mintTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        mintTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!mintTxInvoices[0].success) {
        throw Error(
          `AssetMintTransaction failed: ${JSON.stringify(
            mintTxInvoices[0].error
          )}`
        );
      }

      const gold = mintTx.getMintedAsset();
      const goldInput = gold.createTransferInput();
      const expiration = Math.round(Date.now() / 1000) + 1000;
      const order = sdk.core.createOrder({
        assetTypeFrom:
          "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        assetTypeTo: new H256(
          "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
        ),
        assetAmountFrom: 100,
        assetAmountTo: 1000,
        expiration,
        originOutputs: [goldInput.prevOut],
        recipientFrom: aliceAddress
      });

      const id = await controllers.orderController.submit(
        [goldInput],
        order,
        0,
        aliceAddress.toString()
      );
      orderWatcher.addOrderForValidity([id as number, [[mintTx.hash(), 0]]]);

      await sleep(10000);

      const changeTx = sdk.core
        .createAssetTransferTransaction()
        .addInputs(mintTx.getMintedAsset())
        .addOutputs({
          recipient: aliceAddress,
          amount: 10000,
          assetType: mintTx.getMintedAsset().assetType
        });
      await sdk.key.signTransactionInput(changeTx, 0);
      const changeParcel = sdk.core.createAssetTransactionParcel({
        transaction: changeTx
      });

      await sdk.rpc.chain.sendParcel(changeParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const changeTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        changeTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!changeTxInvoices[0].success) {
        throw Error(
          `AssetChangeTransaction failed: ${JSON.stringify(
            mintTxInvoices[0].error
          )}`
        );
      }

      await sleep(10000);
      const list = await controllers.orderController.find(
        "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        100
      );

      orderWatcher.stop();
      expect(list.length).to.equal(0);
    })().catch(async error => {
      console.error(`Error:`, error);
      orderWatcher.stop();
    });
  }).timeout(50000);

  it("Expired order check test", async () => {
    const ACCOUNT_ADDRESS =
      process.env.ACCOUNT_ADDRESS ||
      "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
    const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

    await (async () => {
      const aliceAddress = await sdk.key.createAssetTransferAddress();

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
      const mintTx = sdk.core.createAssetMintTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
      });
      const mintParcel = sdk.core.createAssetTransactionParcel({
        transaction: mintTx
      });

      await sdk.rpc.chain.sendParcel(mintParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const mintTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        mintTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!mintTxInvoices[0].success) {
        throw Error(
          `AssetMintTransaction failed: ${JSON.stringify(
            mintTxInvoices[0].error
          )}`
        );
      }

      const gold = mintTx.getMintedAsset();
      const goldInput = gold.createTransferInput();
      const expiration = Math.round(Date.now() / 1000) + 5;
      const order = sdk.core.createOrder({
        assetTypeFrom:
          "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        assetTypeTo: new H256(
          "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
        ),
        assetAmountFrom: 100,
        assetAmountTo: 1000,
        expiration,
        originOutputs: [goldInput.prevOut],
        recipientFrom: aliceAddress
      });

      const id = await controllers.orderController.submit(
        [goldInput],
        order,
        0,
        aliceAddress.toString()
      );
      orderWatcher.addOrderForExpiration([id as number, expiration]);

      await sleep(10000);

      const changeTx = sdk.core
        .createAssetTransferTransaction()
        .addInputs(mintTx.getMintedAsset())
        .addOutputs({
          recipient: aliceAddress,
          amount: 10000,
          assetType: mintTx.getMintedAsset().assetType
        });
      await sdk.key.signTransactionInput(changeTx, 0);
      const changeParcel = sdk.core.createAssetTransactionParcel({
        transaction: changeTx
      });

      await sdk.rpc.chain.sendParcel(changeParcel, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
      });
      const changeTxInvoices = await sdk.rpc.chain.getTransactionInvoices(
        changeTx.hash(),
        {
          timeout: 300 * 1000
        }
      );
      if (!changeTxInvoices[0].success) {
        throw Error(
          `AssetChangeTransaction failed: ${JSON.stringify(
            mintTxInvoices[0].error
          )}`
        );
      }

      await sleep(10000);
      const list = await controllers.orderController.find(
        "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        100
      );
      orderWatcher.stop();
      expect(list.length).to.equal(0);
    })().catch(async error => {
      console.error(`Error:`, error);
      orderWatcher.stop();
    });
  }).timeout(50000);

  after(async () => {
    await db.Order.destroy({
      where: { marketId: "0" }
    });
    await db.sequelize.close();
  });
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
