import { SDK } from "codechain-sdk";
// import * as Config from "../config/dex.json";
import { OrderWatcher } from "./orderWatcher";

// import * as chai from "chai";

// const expect = chai.expect;

describe("orderWatcher basic test", () => {
  it("Invalidity check test", () => {
    const sdk = new SDK({
      server: process.env.CODECHAIN_RPC_HTTP || "localhost:8080",
      networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
    });

    const orderWatcher = new OrderWatcher();
    orderWatcher.run();

    const ACCOUNT_ADDRESS =
      process.env.ACCOUNT_ADDRESS ||
      "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
    // const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "password";

    (async () => {
      const aliceAddress = "tcaqyqsdk4knmjdr5upjf6enlx0dgr6f4st4vcq6rgl33";
      // const bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

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
      /* const silverAssetScheme = sdk.core.createAssetScheme({
        shardId: 0,
        metadata: JSON.stringify({
          name: "DEX test",
          description: "DEX test asset",
          icon_url:
            "https://cdn.shopify.com/s/files/1/0010/9215/7503/t/10/assets/cbt2/images/result-clipboard.png?11678745080217472983"
        }),
        amount: 100000,
        approver: null
      });*/
      const mintTx = sdk.core.createAssetMintTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
      });
      const mintParcel = sdk.core.createAssetTransactionParcel({
        transaction: mintTx
      });
      const keyStore = await sdk.key.createLocalKeyStore(
        "/home/gnu/key/keystore.db"
      );
      const seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
      const signedParcel = await sdk.key.signParcel(mintParcel, {
        keyStore,
        account: ACCOUNT_ADDRESS,
        fee: 10,
        seq
      });
      await sdk.rpc.chain.sendSignedParcel(signedParcel);
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

      /*const gold = mintTx.getMintedAsset();
      /*const goldInput = gold.createTransferInput();
      const expiration = Math.round(Date.now() / 1000) + 1000;
      /*const order = sdk.core.createOrder({
        assetTypeFrom: gold.assetType,
        assetTypeTo: gold.assetType,
        assetAmountFrom: 100,
        assetAmountTo: 1000,
        expiration,
        originOutputs: [goldInput.prevOut],
        recipient: aliceAddress
      });
      /*const partialTransferTx = sdk.core
        .createAssetTransferTransaction()
        .addInputs(goldInput);
      /*const transferTx = partialTransferTx
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
        });*/
    })().catch(err => {
      console.error(`Error:`, err);
    });
  });

  it("Expiration check test", () => {
    console.log("Not implemented");
  });
});
