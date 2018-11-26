<template>
  <div class="contents">
    <div class="row mb-4">
      <div class="col-xl-3">
        <MyWallet></MyWallet>
      </div>
      <div class="col-xl-3">
        <OrderBook></OrderBook>
      </div>
      <div class="col-xl-6">
        <Chart></Chart>
      </div>
    </div>
    <!-- Columns start at 50% wide on mobile and bump up to 33.3% wide on desktop -->
    <div class="row mb-4">
      <div class="col-xl-3">
        <MyOrder></MyOrder>
      </div>
      <div class="col-xl-3">
        <BuySell></BuySell>
      </div>
      <div class="col-xl-3">
        <Market></Market>
      </div>
      <div class="col-xl-3">
        <History></History>
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
</style>
