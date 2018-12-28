<template>
  <div class="order-log">
    <nav>
      <div class="nav nav-tabs nav-justified" id="nav-tab" role="tablist">
        <a
          class="nav-item nav-link active"
          id="nav-home-tab"
          data-toggle="tab"
          href="#nav-home"
          role="tab"
          aria-controls="nav-home"
          aria-selected="true"
        >Open orders</a>
        <a
          class="nav-item nav-link"
          id="nav-profile-tab"
          data-toggle="tab"
          href="#nav-profile"
          role="tab"
          aria-controls="nav-profile"
          aria-selected="false"
        >Order history</a>
      </div>
    </nav>
    <div class="tab-content" id="nav-tabContent">
      <div
        class="tab-pane fade show active"
        id="nav-home"
        role="tabpanel"
        aria-labelledby="nav-home-tab"
      >
        <b-table hover small :items="orders" :fields="orderFields"></b-table>
      </div>
      <div class="tab-pane fade" id="nav-profile" role="tabpanel" aria-labelledby="nav-profile-tab">
        <b-table hover small :items="deals" :fields="dealFields"></b-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class MyOrder extends Vue {
  public orders: object = [];
  public orderFields: object = {
    amount: { label: "amount" },
    rate: { label: "rate" },
    makerAsset: { label: "from" },
    takerAsset: { label: "to" }
  };
  public deals: object = [];
  public dealFields: object = {
    makerAsset: { label: "from" },
    takerAsset: { label: "to" },
    makerAmount: { label: "amount" }
  };

  public async mounted() {
    const assetAddresses = await window.walletAPI.getAssetAddresses();

    axios
      .get("http://localhost:8000/api/order/find", {
        params: { makerAddress: "testMaker" }
      })
      .then(response => {
        response.data.map((item: any) => {
          item.makerAsset = "0x" + item.makerAsset.slice(0, 3) + "...";
          item.takerAsset = "0x" + item.takerAsset.slice(0, 3) + "...";
          return item;
        });
        this.orders = response.data;
      })
      .catch(error => {
        console.log(error);
      });
    axios
      .get("http://localhost:8000/api/deal/find", {
        params: { maker: "testmaker" }
      })
      .then(response => {
        this.deals = response.data;
      })
      .catch(error => {
        console.log(error);
      });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

.order-log {
  overflow: hidden;
  scrollbar-base-color: rgb(255, 255, 255);
  scrollbar-face-color: rgb(0, 0, 0);
  scrollbar-3dlight-color: rgb(255, 250, 250);
  scrollbar-highlight-color: rgb(255, 255, 255);
  scrollbar-track-color: rgb(255, 255, 255);
  scrollbar-arrow-color: rgb(255, 255, 255);
  scrollbar-shadow-color: rgb(0, 0, 0);
  -ms-overflow-style: -ms-autohiding-scrollbar;
}
.classWithPad {
  padding: 0px;
}

/* TABLE */
.tab-content .table-container {
  height: 12rem;
  overflow-y: scroll;
  overflow-x: scroll;
}

.tab-content {
  height: 100%;
}

.tab-content .tab-pane {
  overflow-x: scroll;
  height: 100%;
}

.table th {
  height: 25px;
  font-family: $font;
  font-size: 15px;
  padding: 0px;
}
.table-head {
  background: $main; /* Old browsers */
}
th {
  font-family: $font;
  font-size: 15px;
  padding: 0px;
}
p {
  margin: 0px;
  padding: 10px;
}
.table td {
  font-family: $font;
  font-size: 12px;
  padding: 0px;
  width: 15px;
}
.item {
  background: $table-background;
}

/* SCROLL BAR */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}
::-webkit-scrollbar {
  width: 6px;
  background-color: #f5f5f5;
}
::-webkit-scrollbar-thumb {
  background-color: #000000;
}

/* WINDOW BACKGROUND */
.order-log {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
