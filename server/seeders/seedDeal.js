"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    let deals = [];
    for (let i = 0; i < 100; i++) {
      deals.push({
        maker: "testmaker",
        taker: "testtaker",
        makerAsset: "testmakerasset",
        takerAsset: "testtakerasset",
        makerAmount: 10,
        takerAmount: 10,
        createdAt: "2018-12-05T03:27:36.388Z",
        updatedAt: "2018-12-05T03:27:36.388Z"
      });
    }
    return queryInterface.bulkInsert("Deals", deals, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Deals", null, {});
  }
};
