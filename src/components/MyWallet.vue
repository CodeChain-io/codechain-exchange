<template>
  <div class="wallet">
    <div class="table-name" style="text-align: left">
      <span class="letter" data-letter="W">W</span>
      <span class="letter" data-letter="a">a</span>
      <span class="letter" data-letter="l">l</span>
      <span class="letter" data-letter="l">l</span>
      <span class="letter" data-letter="e">e</span>
      <span class="letter" data-letter="t">t</span>
    </div>
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
@import url(https://fonts.googleapis.com/css?family=Lato:900);
*,
*:before,
*:after {
  box-sizing: border-box;
}
body {
  font-family: "Lato", sans-serif;
}
div.table-name {
  width: 90%;
  margin: 0 auto;
  text-align: center;
  height: 40px;
}
.letter {
  display: inline-block;
  font-weight: 900;
  font-size: 25px;
  margin: 0.2em;
  position: relative;
  color: #00b4f1;
  transform-style: preserve-3d;
  perspective: 400;
  z-index: 1;
}
.letter:before,
.letter:after {
  position: absolute;
  content: attr(data-letter);
  transform-origin: top left;
  top: 0;
  left: 0;
}
.letter,
.letter:before,
.letter:after {
  transition: all 0.3s ease-in-out;
}
.letter:before {
  color: #fff;
  text-shadow: -1px 0px 1px rgba(255, 255, 255, 0.8),
    1px 0px 1px rgba(0, 0, 0, 0.8);
  z-index: 3;
  transform: rotateX(0deg) rotateY(-15deg) rotateZ(0deg);
}
.letter:after {
  color: rgba(0, 0, 0, 0.11);
  z-index: 2;
  transform: scale(1.08, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)
    skew(0deg, 1deg);
}
.letter:hover:before {
  color: #fafafa;
  transform: rotateX(0deg) rotateY(-40deg) rotateZ(0deg);
}
.letter:hover:after {
  transform: scale(1.08, 1) rotateX(0deg) rotateY(40deg) rotateZ(0deg)
    skew(0deg, 22deg);
}

/* WINDOW BACKGROUND */
.wallet {
  background: $sub;
  border-radius: 15px;
  padding-bottom: 15px;
}
</style>
