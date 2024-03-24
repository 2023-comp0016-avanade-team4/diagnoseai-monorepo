import * as tedious from "tedious"; // imported for compilation
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Database configuration not found");
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mssql",
  dialectModule: tedious,
});
