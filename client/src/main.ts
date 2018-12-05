import Vue from "vue";
import App from "./App.vue";
import Highcharts from "highcharts";

const HighchartsVue = require("highcharts-vue");
const stockInit = require("highcharts/modules/stock");

stockInit(Highcharts);

Vue.use(HighchartsVue);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
