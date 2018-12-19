import { H256 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
import { controllers } from "../../controllers";
import db from "../../models";
import { OrderWatcher } from "../orderWatcher";

// To execute test, change orderWatcher's target node to localhost
const sdk = new SDK({
  server: process.env.CODECHAIN_RPC_HTTP || "http://127.0.0.1:8080",
  networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
});

const orderWatcher = new OrderWatcher();
orderWatcher.run();

const ACCOUNT_ADDRESS =
  process.env.ACCOUNT_ADDRESS || "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

try {
  (async () => {
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
      recipient: aliceAddress
    });

    const id = await controllers.orderController.submit(
      [goldInput],
      order,
      0,
      aliceAddress.toString()
    );

    orderWatcher.addOrderForExpiration([id as number, expiration]);
    await sleep(10000);

    const list = await controllers.orderController.find(
      "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      100,
      0
    );
    if (list.length !== 0) {
      throw Error("Invalid order is not removed properly");
    }

    db.Order.destroy({
      where: { marketId: 0 },
      truncate: true
    });
    orderWatcher.stop();
  })().catch(err => {
    db.Order.destroy({
      where: { marketId: 0 },
      truncate: true
    });
    console.error(`Error:`, err);
  });
} catch (error) {
  console.error(`Error:`, error);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
