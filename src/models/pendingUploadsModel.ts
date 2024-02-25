import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db";

class PendingUploads extends Model<
  InferAttributes<PendingUploads>,
  InferCreationAttributes<PendingUploads>
> {
  declare id: string;
  declare filename: string;
  declare username: string;
  declare user_email: string;
  declare machine_id: string;
  declare sent_at: Date;
}

PendingUploads.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: sequelize.fn("uuid_generate_v4"),
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    machine_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn("now"),
    },
  },
  {
    sequelize,
    modelName: "pending_uploads",
    timestamps: false,
  },
);

export { PendingUploads };
