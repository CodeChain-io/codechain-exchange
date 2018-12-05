"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    let orders1 = [];
    let orders2 = [];
    for (let i = 0; i < 100; i++) {
      orders1.push({
        makerAsset: "testAsset1",
        takerAsset: "testAsset2",
        amount: 10,
        filled: 0,
        rate: i + 1,
        makerAddress: "testMaker",
        signature: "testSignaure",
        transaction: "testTransaction",
        createdAt: "2018-12-05T03:27:36.388Z",
        updatedAt: "2018-12-05T03:27:36.388Z"
      });
      orders1.push({
        makerAsset: "testAsset2",
        takerAsset: "testAsset1",
        amount: 10,
        filled: 0,
        rate: i + 1,
        makerAddress: "testMaker",
        signature: "testSignaure",
        transaction: "testTransaction",
        createdAt: "2018-12-05T03:27:36.388Z",
        updatedAt: "2018-12-05T03:27:36.388Z"
      });
    }
    return queryInterface.bulkInsert("Orders", orders1.concat(orders2), {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Order", null, {});
  }
};
