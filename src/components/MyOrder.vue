<template>
  <div class="my-order">
    <div class="table-name" style="text-align: left">
      <span class="letter" data-letter="M">M</span>
      <span class="letter" data-letter="y">y</span>
      <span class="letter" data-letter="o">o</span>
      <span class="letter" data-letter="r">r</span>
      <span class="letter" data-letter="d">d</span>
      <span class="letter" data-letter="e">e</span>
      <span class="letter" data-letter="r">r</span>
    </div>
    <div>
      <table class="table mb-0 table-head">
        <thead>
          <tr>
            <th class="row-1" scope="col">#</th>
            <th class="row-2" scope="col">First</th>
            <th class="row-3" scope="col">Last</th>
            <th class="row-4" scope="col">Handle</th>
          </tr>
        </thead>
      </table>
    </div>
    <div class="table-container">
      <table class="table table-hover">
        <tbody class="item">
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class MyOrder extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

.my-order {
  overflow: hidden;
  scrollbar-base-color: rgb(255, 255, 255);
  scrollbar-face-color: rgb(0, 0, 0);
  scrollbar-3dlight-color: rgb(255, 250, 250);
  scrollbar-highlight-color: rgb(255, 255, 255);
  scrollbar-track-color: rgb(255, 255, 255);
  scrollbar-arrow-color: rgb(255, 255, 255);
  scrollbar-shadow-color: rgb(0, 0, 0);
  -ms-overflow-style: -ms-autohiding-scrollbar;
}
.classWithPad {
  padding: 0px;
}

/* CONTENT NAME */
@import url(https://fonts.googleapis.com/css?family=Lato:900);
*,
*:before,
*:after {
  box-sizing: border-box;
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

/* TABLE */
.table-container {
  height: 15rem;
  overflow-y: scroll;
  overflow-x: hidden;
}
.table-head {
  background: $main; /* Old browsers */
}
th {
  font-family: $font;
  font-size: 15px;
  padding: 0px;
}
p {
  margin: 0px;
  padding: 10px;
}
.table td {
  font-family: $font;
  font-size: 12px;
  padding: 0px;
  width: 15px;
}
.item {
  background: $table-background;
}

/* SCROLL BAR */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}
::-webkit-scrollbar {
  width: 6px;
  background-color: #f5f5f5;
}
::-webkit-scrollbar-thumb {
  background-color: #000000;
}

/* WINDOW BACKGROUND */
.my-order {
  background: $sub;
  border-radius: 15px;
  padding-bottom: 15px;
}
</style>
