"""
This module contains the models and data access object for work orders in the
system.

The module defines the following classes:
- WorkOrderModel: Represents a work order in the database.
- MachineModel: Represents a machine in the database.
- WorkOrderDAO: Data Access Object for work orders.

"""

from typing import List, Optional, Literal, cast
from uuid import uuid4

from sqlalchemy import (DateTime,  # noqa: E501 pylint: disable=E0401
                        ForeignKey, String, Text, func)
from sqlalchemy.orm import (Mapped, Session,  # pylint: disable=E0401
                            mapped_column, relationship)

from .common import Base
from .conversation_status import ConversationStatusModel
from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin


# pylint: disable=too-few-public-methods
class WorkOrderModel(Base):
    """
    Represents a work order in the system.
    """

    __tablename__ = "work_orders"
    order_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36)
    )  # Assuming user_id is string from clerk
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversation_status.conversation_id"))

    machine_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("machines.machine_id")
    )
    task_name: Mapped[str] = mapped_column(String(255))
    task_desc: Mapped[str] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, default=func.now()  # pylint: disable=not-callable
    )  # Automatically sets to current time

    conversation: Mapped["ConversationStatusModel"] = relationship(
        "ConversationStatusModel",
        back_populates="work_orders",
        uselist=False)
    machine: Mapped["MachineModel"] = relationship(
        "MachineModel", back_populates="work_orders")


# pylint: disable=too-few-public-methods
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

    work_orders: Mapped[List["WorkOrderModel"]] = relationship(
        "WorkOrderModel", back_populates="machine")
    pending_uploads = relationship("PendingUploadsModel",
                                   back_populates="machine")

    def get_machine_name(self) -> str:
        """
        Gets the canonical machine name
        """
        return f"{self.manufacturer} {self.model}"


@dataclass
class ResponseWorkOrderFormat(DataClassJsonMixin):
    """
    Response work order data class.
    """
    order_id: str
    machine_id: str
    machine_name: str
    conversation_id: str
    resolved: Literal['not_completed', 'completed']

    @staticmethod
    def from_dao_result(work_order: WorkOrderModel
                        ) -> "ResponseWorkOrderFormat":
        """
        Converts a work order model into a response work order format.

        Args:
            work_order (WorkOrderModel): The work order model

        Returns:
            ResponseWorkOrderFormat: The response work order format
        """
        return ResponseWorkOrderFormat(
            order_id=work_order.order_id,
            machine_id=work_order.machine_id,
            machine_name=cast(MachineModel,
                              work_order.machine).get_machine_name(),
            conversation_id=work_order.conversation_id,
            resolved=cast(Literal['not_completed', 'completed'],
                          cast(ConversationStatusModel,
                               work_order.conversation).status.name)
        )


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
    ) -> Optional[str]:
        """
        Gets the machine name for a specific machine ID.

        Args:
            session (Session): The database session
            machine_id (str): The machine ID

        Returns:
            Optional[str]: The machine name
        """
        machine = session.query(MachineModel).get(machine_id)
        return f"{machine.manufacturer} {machine.model}" if machine else None

    @staticmethod
    def get_user_id_for_conversation_id(
        session: Session, conversation_id: str
    ) -> Optional[str]:
        """
        Gets the user ID for a specific conversation ID.

        Args:
            session (Session): The database session
            conversation_id (str): The conversation ID

        Returns:
            Optional[str]: The user ID
        """
        work_order = (
            session.query(WorkOrderModel)
            .filter(WorkOrderModel.conversation_id == conversation_id)
            .first()
        )
        return work_order.user_id if work_order else None
