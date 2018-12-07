import * as fs from "fs";
import * as path from "path";
import * as Sequelize from "sequelize";
import { OrderAttriubutes, OrderInstance } from "./order";

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(`${__dirname}/../config/config.json`)[env];
const db: any = {};

let sequelize: any;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

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
db.Sequelize = Sequelize;

interface Model {
  Order: Sequelize.Model<OrderInstance, OrderAttriubutes>;
}

export default db as Model;
