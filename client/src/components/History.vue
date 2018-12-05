<template>
  <div class="history">
    <div class="table-name">History</div>
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
            <td scope="row">2</td>
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
export default class History extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../styles/General.scss";

.history {
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

/* TABLE */
.table-container {
  height: calc(100% - 25px - 40px);
  overflow: scroll;
  overflow-x: auto;
}
.table th {
  height: 25px;
  font-family: $font;
  font-size: 15px;
  padding: 0px;
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
.history {
  height: 100%;
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
