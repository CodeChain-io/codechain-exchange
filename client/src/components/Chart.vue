<template>
  <div class="chart"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Chart extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
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

/* CHART */
.stock {
  height: calc(100% - 40px); /* 16:9 ratio*/
  margin: 0 auto;
}

/* WINDOW BACKGROUND */
.chart {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
