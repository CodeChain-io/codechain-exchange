<template>
  <div class="contents">
    <div class="container-fluid">
      <div class="row mb-4 row1">
        <div class="col-xl-3 market mb-3 order-lg-1">
          <Market></Market>
        </div>
        <div class="col-xl-6 col-xl-6 chart mb-3 order-lg-3">
          <Chart></Chart>
        </div>
        <div class="col-xl-3 orderbook mb-3 order-lg-2">
          <OrderBook></OrderBook>
        </div>
      </div>
      <div class="row mb-4 row2">
        <div class="col-xl-3 buysell mb-3 order-lg-2">
          <BuySell></BuySell>
        </div>
        <div class="col-xl-3 myorder mb-3 order-lg-3">
          <MyOrder></MyOrder>
        </div>
        <div class="col-xl-3 wallet mb-3 order-lg-1">
          <MyWallet></MyWallet>
        </div>
        <div class="col-xl-3 history mb-3 order-lg-last">
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
@import "../styles/Mixin.scss";

@include respond_above(lg) {
  & {
    .row1 {
      height: 60%;
    }

    .row2 {
      height: 40%;
    }
  }
}

@include respond_below(xs) {
  & {
    .market,
    .chart,
    .orderbook,
    .buysell,
    .myorder,
    .wallet,
    .history {
      max-height: 22rem;
    }
  }
}

.container-fluid {
  height: 100%;
}
</style>
