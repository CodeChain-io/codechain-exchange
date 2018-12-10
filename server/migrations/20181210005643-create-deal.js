"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Deals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      maker: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taker: {
        allowNull: false,
        type: Sequelize.STRING
      },
      makerAsset: {
        allowNull: false,
        type: Sequelize.STRING
      },
      takerAsset: {
        allowNull: false,
        type: Sequelize.STRING
      },
      makerAmount: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      takerAmount: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Deals");
  }
};
