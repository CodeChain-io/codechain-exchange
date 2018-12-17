import { H256 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
import { controllers } from "../controllers";
// import * as Config from "../config/dex.json";
import { OrderWatcher } from "./orderWatcher";
// import db from "../models";
// import * as chai from "chai";

// const expect = chai.expect;

const sdk = new SDK({
  server: process.env.CODECHAIN_RPC_HTTP || "http://127.0.0.1:8080",
  networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
});

const orderWatcher = new OrderWatcher();
orderWatcher.run();

const ACCOUNT_ADDRESS =
  process.env.ACCOUNT_ADDRESS || "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

(async () => {
  const aliceAddress = await sdk.key.createAssetTransferAddress();

  // Create asset named Gold. Total amount of Gold is 10000. The approver is set
  // to null, which means this type of asset can be transferred freely.
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
      `AssetMintTransaction failed: ${JSON.stringify(mintTxInvoices[0].error)}`
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
    recipient: aliceAddress
  });
  const partialTransferTx = sdk.core
    .createAssetTransferTransaction()
    .addInputs(goldInput);
  const transferTx = partialTransferTx
    .addOutputs(
      {
        recipient: aliceAddress,
        amount: 10000 - 100,
        assetType: gold.assetType
      },
      {
        recipient: aliceAddress,
        amount: 1000,
        assetType: gold.assetType
      }
    )
    .addOrder({
      order,
      spentAmount: 0,
      inputIndices: [0],
      outputIndices: [0, 1]
    });

  const id = await controllers.orderController.submit(
    transferTx,
    0,
    aliceAddress.toString()
  );
  console.log(id);
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

  const list1 = await controllers.orderController.find(
    "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
    "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
  );
  console.log(list1);
})().catch(err => {
  console.error(`Error:`, err);
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
