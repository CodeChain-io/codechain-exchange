<template>
  <div class="wallet">
    <div class="table-name">Wallet</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class MyWallet extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

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

/* WINDOW BACKGROUND */
.wallet {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
