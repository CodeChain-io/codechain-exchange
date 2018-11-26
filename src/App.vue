<template>
  <div id="app">
    <Banner></Banner>
    <PriceBar token1="token1" token2="toekn2" volume="10"></PriceBar>
    <Content></Content>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Banner from "./components/Banner.vue";
import PriceBar from "./components/PriceBar.vue";
import Content from "./components/Contents.vue";

@Component({
  components: {
    Banner,
    PriceBar,
    Content
  }
})
export default class App extends Vue {}
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
  margin: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
