"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      makerAsset: {
        allowNull: false,
        type: Sequelize.STRING
      },
      takerAsset: {
        allowNull: false,
        type: Sequelize.STRING
      },
      amount: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      rate: {
        allowNull: false,
        type: Sequelize.DOUBLE
      },
      makerAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      assetList: {
        allowNull: false,
        type: Sequelize.JSON
      },
      order: {
        allowNull: false,
        type: Sequelize.JSON
      },
      marketId: {
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
    return queryInterface.dropTable("Orders");
  }
};
