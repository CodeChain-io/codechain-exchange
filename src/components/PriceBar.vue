<template>
  <div id="price-bar" class="sticky-top">
    <p align="left">
      <span id="ratio">&ensp;{{token1}} / {{token2}}</span>&ensp;&ensp;&ensp;&ensp;
      <span id="volume">Volume: {{volume}}</span>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class PriceBar extends Vue {
  @Prop()
  private token1!: string;
  @Prop()
  private token2!: string;
  @Prop()
  private volume!: number;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

#ratio {
  font-family: $font;
  font-size: 1.5rem;
}

#volume {
  font-family: $font;
  font-size: 1rem;
}

#price-bar {
  background: $main;
}
</style>
