import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db";
import { Machine } from "./workOrderModel";

class PendingUploads extends Model<
  InferAttributes<PendingUploads>,
  InferCreationAttributes<PendingUploads>
> {
  declare upload_id: string;
  declare filename: string;
  declare username: string;
  declare user_email: string;
  declare machine_id: string;
  declare sent_at: Date;
}

PendingUploads.init(
  {
    upload_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: "pending_uploads",
    timestamps: false,
  },
);

PendingUploads.belongsTo(Machine, { foreignKey: "machine_id" });
Machine.hasMany(PendingUploads, { foreignKey: "machine_id" });

export { PendingUploads };
