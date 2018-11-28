<template>
  <div class="chart">
    <div class="table-name" style="text-align: left">
      <span class="letter" data-letter="C">C</span>
      <span class="letter" data-letter="h">h</span>
      <span class="letter" data-letter="a">a</span>
      <span class="letter" data-letter="r">r</span>
      <span class="letter" data-letter="t">t</span>
    </div>
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
        chart: {
          height: 455
        },
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

/* CHART */
.stock {
  height: (9 / 16 * 100) + "%"; /* 16:9 ratio*/
  margin: 0 auto;
}

/* WINDOW BACKGROUND */
.chart {
  background: $sub;
  border-radius: $window-radius;
  padding-bottom: 15px;
}
</style>
