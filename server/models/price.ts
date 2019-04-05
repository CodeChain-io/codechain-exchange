import * as Sequelize from "sequelize";

export interface PriceAttriubutes {
  id?: string;
  price: number;
  date: Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceInstance extends Sequelize.Instance<PriceAttriubutes> {}

export default (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
) => {
  const Price = sequelize.define(
    "Price",
    {
      price: DataTypes.DOUBLE,
      date: DataTypes.DATE
    },
    {}
  );
  Price.associate = _models => {
    // associations can be defined here
  };
  return Price;
};
