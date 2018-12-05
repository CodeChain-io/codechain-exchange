<template>
  <div class="chart">
    <div class="table-name">Chart</div>
    <highcharts class="stock" :constructor-type="'stockChart'" :options="stockOptions"></highcharts>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

const data = require("../assets/aapl-ohlcv.json");

// split the data set into ohlc and volume
var ohlc: number[][] = [],
  volume: number[][] = [],
  dataLength = data.length,
  // set the allowed units for data grouping
  groupingUnits = [
    [
      "week", // unit name
      [1] // allowed multiples
    ],
    ["month", [1, 2, 3, 4, 6]]
  ];

for (var i = 0; i < dataLength; i += 1) {
  ohlc.push([
    data[i][0], // the date
    data[i][1], // open
    data[i][2], // high
    data[i][3], // low
    data[i][4] // close
  ]);

  volume.push([
    data[i][0], // the date
    data[i][5] // the volume
  ]);
}

@Component
export default class Chart extends Vue {
  data() {
    return {
      data: data,
      stockOptions: {
        rangeSelector: {
          selected: 1
        },

        title: {
          text: "AAPL Historical"
        },

        yAxis: [
          {
            labels: {
              align: "right",
              x: -3
            },
            title: {
              text: "OHLC"
            },
            height: "60%",
            lineWidth: 2,
            resize: {
              enabled: true
            }
          },
          {
            labels: {
              align: "right",
              x: -3
            },
            title: {
              text: "Volume"
            },
            top: "65%",
            height: "35%",
            offset: 0,
            lineWidth: 2
          }
        ],

        tooltip: {
          split: true
        },

        series: [
          {
            type: "candlestick",
            name: "AAPL",
            data: ohlc,
            dataGrouping: {
              units: groupingUnits
            }
          },
          {
            type: "column",
            name: "Volume",
            data: volume,
            yAxis: 1,
            dataGrouping: {
              units: groupingUnits
            }
          }
        ]
      }
    };
  }
}
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
