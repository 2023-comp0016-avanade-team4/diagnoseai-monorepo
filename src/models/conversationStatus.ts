import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import { WorkOrder } from "./workOrderModel";

interface ConversationStatusAttributes {
  conversation_id: string;
  status: 'COMPLETED' | 'NOT_COMPLETED';
}

interface ConversationStatusCreationAttributes
  extends Optional<ConversationStatusAttributes, "conversation_id"> {}

class ConversationStatus
  extends Model<ConversationStatusAttributes, ConversationStatusCreationAttributes>
  implements ConversationStatusAttributes {
  public conversation_id!: string;
  public status!: 'COMPLETED' | 'NOT_COMPLETED';
}

ConversationStatus.init(
  {
    conversation_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: Sequelize.fn("uuid_generate_v4"),
    },
    status: {
      type: DataTypes.ENUM("COMPLETED", "NOT_COMPLETED"),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ConversationStatus",
    tableName: "conversation_status",
    timestamps: false,
    underscored: true,
  },
);

ConversationStatus.hasOne(WorkOrder, { foreignKey: "conversation_id" });
WorkOrder.hasOne(ConversationStatus, { foreignKey: "conversation_id" });

export { ConversationStatus };
