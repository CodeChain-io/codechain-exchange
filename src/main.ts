import Vue from "vue";
import App from "./App.vue";
import HighchartsVue from "highcharts-vue";
import Highcharts from "highcharts";
import stockInit from "highcharts/modules/stock";

stockInit(Highcharts);

Vue.use(HighchartsVue);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
