<template>
  <div class="banner">
    <nav class="navbar navbar-expand-lg navbar-light">
      <a class="navbar-brand" href=".">
        <img src="../assets/logo.png" width="30" height="30" class="d-inline-block align-top" alt>CODEX
      </a>
      <ul class="nav navbar-nav mx-auto">
        <li class="nav-item">
          <a class="nav-link" href="#">Anouncement</a>
        </li>
      </ul>
      <span class="navbar-text">Powered by Kodebox</span>
    </nav>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Banner extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
@import "../styles/General.scss";
.navbar {
  background-color: $banner;
  padding: 0;
  height: 40px;
}
</style>
