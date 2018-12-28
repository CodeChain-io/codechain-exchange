<template>
  <div id="app">
    <Banner class="banner"></Banner>
    <Content class="contents"></Content>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Banner from "./components/Banner.vue";
import Content from "./components/Contents.vue";

(async () => {
  const login = await window.walletAPI.isAuthenticated();
  if (!login) {
    alert("Please login");
    location.reload();
  }
})();

@Component({
  components: {
    Banner,
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
}
.contents {
  height: calc(100vh - 130px);
}
.banner {
  margin-bottom: 1rem;
}
</style>
