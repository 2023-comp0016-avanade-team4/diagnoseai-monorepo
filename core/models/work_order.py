"""
This module contains the models and data access object for work orders in the
system.

The module defines the following classes:
- WorkOrderModel: Represents a work order in the database.
- MachineModel: Represents a machine in the database.
- WorkOrderDAO: Data Access Object for work orders.

"""

from uuid import uuid4
from typing import List
from sqlalchemy import String, ForeignKey, Text, DateTime, func  # noqa: E501 pylint: disable=E0401
from sqlalchemy.orm import (  # pylint: disable=E0401
    Mapped,
    relationship,
    mapped_column,
    Session,
)

from .common import Base


class WorkOrderModel(Base):
    """
    Represents a work order in the system.

    Attributes:
        order_id (str): The unique identifier for the work order.
        user_id (str): The identifier of the user associated with the work
        order.
        conversation_id (str): The identifier of the conversation related to
        the work order.
        machine_id (str): The identifier of the machine associated with the
        work order.
        task_name (str): The name of the task for the work order.
        task_desc (str): The description of the task for the work order.
        created_at (DateTime): The timestamp when the work order was created.
        machine (MachineModel): The machine associated with the work order.
    """

    __tablename__ = "work_orders"
    order_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36)
    )  # Assuming user_id is string from clerk
    conversation_id: Mapped[str] = mapped_column(
        String(36), default=lambda: str(uuid4())
    )
    machine_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("machines.machine_id")
    )
    task_name: Mapped[str] = mapped_column(String(255))
    task_desc: Mapped[str] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, default=func.now()
    )  # Automatically sets to current time

    machine = relationship("MachineModel", back_populates="work_orders")


class MachineModel(Base):
    """
    Represents a machine in the system.
    """

    __tablename__ = "machines"
    machine_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    manufacturer: Mapped[str] = mapped_column(String(255))
    model: Mapped[str] = mapped_column(String(255))

    work_orders = relationship("WorkOrderModel", back_populates="machine")


class WorkOrderDAO:
    """
    Data Access Object for work orders.
    """

    @staticmethod
    def get_work_orders_for_user(
        session: Session, user_id: str
    ) -> List[WorkOrderModel]:
        """
        Gets all work orders for a specific user.

        Args:
            session (Session): The database session
            user_id (str): The user ID

        Returns:
            List[WorkOrderModel]: A list of work order models
        """
        return (
            session.query(WorkOrderModel)
            .filter(WorkOrderModel.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_machine_name_for_machine_id(
        session: Session, machine_id: str
    ) -> str:
        """
        Gets the machine name for a specific machine ID.

        Args:
            session (Session): The database session
            machine_id (str): The machine ID

        Returns:
            str: The machine name
        """
        machine = session.query(MachineModel).get(machine_id)
        return f"{machine.manufacturer} {machine.model}" if machine else None
