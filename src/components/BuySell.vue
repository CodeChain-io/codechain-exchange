<template>
  <div class="buy-sell">
    <div class="table-name" style="text-align: left">
      <span class="letter" data-letter="O">O</span>
      <span class="letter" data-letter="r">r</span>
      <span class="letter" data-letter="d">d</span>
      <span class="letter" data-letter="e">e</span>
      <span class="letter" data-letter="r">r</span>
    </div>

    <div class="tabnav">
      <ul class="nav nav-tabs nav-justified" id="myTab" role="tablist">
        <li class="nav-item">
          <a
            class="nav-link active"
            id="buy-tab"
            data-toggle="tab"
            href="#buy"
            role="tab"
            aria-controls="buy"
            aria-selected="true"
          >BUY</a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            id="sell-tab"
            data-toggle="tab"
            href="#sell"
            role="tab"
            aria-controls="sell"
            aria-selected="false"
          >SELL</a>
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="buy" role="tabpanel" aria-labelledby="buy-tab">
          <div class="container-fluid">
            <div class="row" style="margin-top:10px">
              <div class="col-3">
                <p align="left">Amount</p>
              </div>
              <div class="col-9">
                <div class="input-group mb-3">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="0"
                    aria-label="amount"
                    aria-describedby="basic-addon2"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Max</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-3">
                <p align="left">Price</p>
              </div>
              <div class="col-9">
                <div class="input-group mb-3">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="0"
                    aria-label="price"
                    aria-describedby="basic-addon2"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Up</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Down</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Total
            <span style="float:right;">0 won</span>
          </p>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Fee
            <span style="float:right;">0 won</span>
          </p>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Total
            <span style="float:right;">0 won</span>
          </p>
          <button
            v-on:click="click('hi')"
            type="button"
            class="btn btn-primary btn-lg btn-block"
            style="margin-top:10px;"
          >BUY</button>
        </div>
        <div class="tab-pane fade" id="sell" role="tabpanel" aria-labelledby="sell-tab">
          <div class="container-fluid">
            <div class="row" style="margin-top:10px">
              <div class="col-3">
                <p align="left">Amount</p>
              </div>
              <div class="col-9">
                <div class="input-group mb-3">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="0"
                    aria-label="amount"
                    aria-describedby="basic-addon2"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Max</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-3">
                <p align="left">Price</p>
              </div>
              <div class="col-9">
                <div class="input-group mb-3">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="0"
                    aria-label="price"
                    aria-describedby="basic-addon2"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Up</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      style="background-color:White;"
                    >Down</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Total
            <span style="float:right;">0 won</span>
          </p>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Fee
            <span style="float:right;">0 won</span>
          </p>
          <p style="text-align:left;font-size:12px;padding-top:0px;padding-bottom:0px;">
            Total
            <span style="float:right;">0 won</span>
          </p>
          <button
            v-on:click="click('hi')"
            type="button"
            class="btn btn-primary btn-lg btn-block"
            style="margin-top:10px;"
          >SELL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class BuySell extends Vue {
  click(msg: String) {
    alert(msg);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

p {
  margin: 0px;
  padding: 10px;
}

/* TAB NAVIGATION */
.tabnav .nav-tabs .nav-item .nav-link.active {
  font-family: $font;
  color: black;
  background-color: transparent;
  border-color: transparent transparent black;
  border-bottom: 4px solid !important;
  font-size: 20px;
}
.tabnav .nav-tabs .nav-item .nav-link {
  font-family: $font;
  border: 1px solid transparent;
  color: black;
  font-size: 18px;
}
.tabnav .nav-tabs {
  background: $main;
}

.tab-content {
  font-family: $font;
}

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
.buy-sell {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
  overflow: auto;
}
</style>
