"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    let orders1 = [];
    let orders2 = [];
    for (let i = 0; i < 100; i++) {
      orders1.push({
        makerAsset:
          "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        takerAsset:
          "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        amount: "10",
        rate: Math.round((i + 1) / 5),
        makerAddress: "testMaker",
        assetList: { input: 10 },
        order: { order: "testOrder" },
        marketId: 1,
        createdAt: (2018 + i).toString() + "-12-05T03:27:36.388Z",
        updatedAt: (2018 + i).toString() + "-12-05T03:27:36.388Z"
      });
      orders1.push({
        makerAsset:
          "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        takerAsset:
          "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        amount: "10",
        rate: Math.round((i + 1) / 5),
        makerAddress: "testMaker",
        assetList: { input: "testTransaction" },
        order: { order: "testOrder" },
        marketId: 1,
        createdAt: (2018 + i).toString() + "-12-05T03:27:36.388Z",
        updatedAt: (2018 + i).toString() + "-12-05T03:27:36.388Z"
      });
    }
    return queryInterface.bulkInsert(
      "Orders",
      orders1.concat(orders2),
      {},
      {
        assetList: { type: new Sequelize.JSON() },
        order: { type: new Sequelize.JSON() }
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Orders", null, {});
  }
};
