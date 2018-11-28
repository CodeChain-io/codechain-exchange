<template>
  <div class="contents">
    <div class="container-fluid">
      <div class="row mb-4 row1">
        <div class="col-xl-3 market">
          <Market></Market>
        </div>
        <div class="col-xl-3 orderbook">
          <OrderBook></OrderBook>
        </div>
        <div class="col-xl-6 chart">
          <Chart></Chart>
        </div>
      </div>
      <div class="row mb-4 row2">
        <div class="col-xl-3 wallet">
          <MyWallet></MyWallet>
        </div>
        <div class="col-xl-3 buysell">
          <BuySell></BuySell>
        </div>
        <div class="col-xl-3 myorder">
          <MyOrder></MyOrder>
        </div>
        <div class="col-xl-3 history">
          <History></History>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import BuySell from "./BuySell.vue";
import Chart from "./Chart.vue";
import History from "./History.vue";
import MyOrder from "./MyOrder.vue";
import MyWallet from "./MyWallet.vue";
import OrderBook from "./OrderBook.vue";
import Market from "./Market.vue";

@Component({
  components: {
    BuySell,
    Chart,
    History,
    MyOrder,
    MyWallet,
    OrderBook,
    Market
  }
})
export default class Contents extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.row1 {
  height: 60%;
}

.row2 {
  height: 40%;
}

.container-fluid {
  height: 100%;
}
</style>
