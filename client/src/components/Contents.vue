<template>
  <div class="contents">
    <div class="container-fluid">
      <div class="row mb-4 row1 justify-content-md-center">
        <div class="col-xl-5">
          <Chart></Chart>
        </div>
        <div class="col-xl-2">
          <OrderBook></OrderBook>
        </div>
      </div>
      <div class="row mb-4 row2 justify-content-md-center">
        <div class="col-xl-4">
          <MyOrder></MyOrder>
        </div>
        <div class="col-xl-3">
          <BuySell></BuySell>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import BuySell from "./BuySell.vue";
import Chart from "./Chart.vue";
import OrderBook from "./OrderBook.vue";
import MyOrder from "./OrderLog.vue";

@Component({
  components: {
    BuySell,
    Chart,
    MyOrder,
    OrderBook
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
}

.container-fluid {
  height: 100%;
}
</style>
