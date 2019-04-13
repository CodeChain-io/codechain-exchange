import * as fs from "fs";
import * as path from "path";
import * as Sequelize from "sequelize";
import { DealAttriubutes, DealInstance } from "./deal";
import { OrderAttriubutes, OrderInstance } from "./order";
import { PriceAttriubutes, PriceInstance } from "./price";

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(`${__dirname}/../config/config.json`)[env];
const db: any = {};

const sequelize = new Sequelize.Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

fs.readdirSync(__dirname)
  .filter(
    file =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".ts"
  )
  .forEach(file => {
    const mod = sequelize.import(path.join(__dirname, file));
    db[(mod as any).name] = mod;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize;

interface Model {
  sequelize: Sequelize.Sequelize;
  Sequelize: Sequelize.SequelizeStatic;
  Order: Sequelize.Model<OrderInstance, OrderAttriubutes>;
  Deal: Sequelize.Model<DealInstance, DealAttriubutes>;
  Price: Sequelize.Model<PriceInstance, PriceAttriubutes>;
}

export default db as Model;
