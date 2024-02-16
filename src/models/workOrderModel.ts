import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

// Import database connection details from .env file
import dotenv from 'dotenv';
dotenv.config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
console.log(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mssql',
});

// Define interfaces for model attributes
interface WorkOrderAttributes {
    order_id: string;
    user_id: string;
    conversation_id: string;
    machine_id: string;
    task_name: string;
    task_desc: string;
    created_at: Date;
}

interface MachineAttributes {
    machine_id: string;
    manufacturer: string;
    model: string;
}

// Define interfaces for model creation attributes
interface WorkOrderCreationAttributes extends Optional<WorkOrderAttributes, 'order_id' | 'conversation_id' | 'created_at'> {}

interface MachineCreationAttributes extends Optional<MachineAttributes, 'machine_id'> {}

// Define WorkOrder model
class WorkOrder extends Model<WorkOrderAttributes, WorkOrderCreationAttributes> implements WorkOrderAttributes {
    public order_id!: string;
    public user_id!: string;
    public conversation_id!: string;
    public machine_id!: string;
    public task_name!: string;
    public task_desc!: string;
    public created_at!: Date;

    // Timestamps!
    public readonly createdAt!: Date;
}

WorkOrder.init(
    {
        order_id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        user_id: {
            type: DataTypes.STRING(36),
            allowNull: false,
        },
        conversation_id: {
            type: DataTypes.STRING(36),
            defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        machine_id: {
            type: DataTypes.STRING(36),
            allowNull: false,
        },
        task_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        task_desc: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    },
    {
        sequelize,
        modelName: 'WorkOrder',
        tableName: 'work_orders',
        timestamps: false,
        underscored: true,
    }
);

// Define Machine model
class Machine extends Model<MachineAttributes, MachineCreationAttributes> implements MachineAttributes {
    public machine_id!: string;
    public manufacturer!: string;
    public model!: string;

    // Timestamps!
    public readonly createdAt!: Date;
}

Machine.init(
    {
        machine_id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        manufacturer: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Machine',
        tableName: 'machines',
        timestamps: false,
        underscored: true,
    }
);

// Define associations between WorkOrder and Machine
WorkOrder.belongsTo(Machine, { foreignKey: 'machine_id' });
Machine.hasMany(WorkOrder, { foreignKey: 'machine_id' });

export { WorkOrder, Machine };
