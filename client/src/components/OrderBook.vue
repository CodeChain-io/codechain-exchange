<template>
  <div class="order-book">
    <b-table hover small :items="items" :fields="fields"></b-table>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class OrderBook extends Vue {
  public items: object = [];
  public fields: object = {
    amount: { label: "amount" },
    rate: { label: "rate" },
    makerAsset: { label: "from" },
    takerAsset: { label: "to" }
  };

  public mounted() {
    axios
      .get("http://localhost:8000/api/orderbook", {
        params: { range: 2 }
      })
      .then(response => {
        response.data.map((item: any) => {
          item.makerAsset = "0x" + item.makerAsset.slice(0, 3) + "...";
          item.takerAsset = "0x" + item.takerAsset.slice(0, 3) + "...";
          return item;
        });
        this.items = response.data;
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

.order-book {
  scrollbar-base-color: rgb(255, 255, 255);
  scrollbar-face-color: rgb(0, 0, 0);
  scrollbar-3dlight-color: rgb(255, 250, 250);
  scrollbar-highlight-color: rgb(255, 255, 255);
  scrollbar-track-color: rgb(255, 255, 255);
  scrollbar-arrow-color: rgb(255, 255, 255);
  scrollbar-shadow-color: rgb(0, 0, 0);
  -ms-overflow-style: -ms-autohiding-scrollbar;
  font-size: 10px;
  overflow-x: scroll;
}

/* ORDER BOOK */
table {
  table-layout: fixed;
}
th {
  font-family: $font;
  font-weight: bold;
}
th,
td {
  text-align: right;
  color: #000000;
}
article {
  font-family: $font;
  color: #eee;
  font-size: 0.8rem;
  padding: 0;
  margin: 0;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}
.divider {
  height: 20px;
  background: $main;
}
.orderbook-header {
  height: 25px;
  background: $main;
  color: white;
}
.current-price {
  font-weight: bold;
}
.side {
  height: 50%;
  background: $table-background;
  font-family: $font;
  overflow-x: hidden;
  overflow-y: scroll;
}
.price.sell {
  color: #c00;
}
.price.buy {
  color: #0c0;
}

/* CONTENT NAME */
div.table-name {
  width: 90%;
  margin: 0 auto;
  text-align: left;
  height: 40px;
  padding: 5px;
  font-family: $font;
  font-size: 20px;
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
.order-book {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
