import * as Sequelize from "sequelize";

export interface DealAttriubutes {
  id?: string;
  maker: string;
  taker: string;
  makerAsset: string;
  takerAsset: string;
  makerAmount: number;
  takerAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DealInstance extends Sequelize.Instance<DealAttriubutes> { }

export default (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
) => {
  const Deal = sequelize.define(
    "Deal",
    {
      maker: DataTypes.STRING,
      taker: DataTypes.STRING,
      makerAsset: DataTypes.STRING,
      takerAsset: DataTypes.STRING,
      makerAmount: DataTypes.INTEGER,
      takerAmount: DataTypes.INTEGER
    },
    {}
  );
  Deal.associate = _ => {
    // associations can be defined here
  };
  return Deal;
};
