from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, declarative_base, relationship, mapped_column, Session
from uuid import uuid4
from typing import List

from .common import Base

class WorkOrderModel(Base):
    __tablename__ = 'work_orders'
    order_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36))  # Assuming user_id is string from clerk
    conversation_id: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid4()))
    machine_id: Mapped[str] = mapped_column(String(36), ForeignKey('machines.machine_id'))
    task_name: Mapped[str] = mapped_column(String(255))
    task_desc: Mapped[str] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())  # Automatically sets to current time

    machine = relationship("MachineModel", back_populates="work_orders")


class MachineModel(Base):
    __tablename__ = 'machines'
    machine_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    manufacturer: Mapped[str] = mapped_column(String(255))
    model: Mapped[str] = mapped_column(String(255))

    work_orders = relationship("WorkOrderModel", back_populates="machine")


class WorkOrderDAO:
    @staticmethod
    def get_work_orders_for_user(session: Session, user_id: str) -> List[WorkOrderModel]:
        """
        Gets all work orders for a specific user.

        Args:
            session (Session): The database session
            user_id (str): The user ID

        Returns:
            List[WorkOrderModel]: A list of work order models
        """
        return session.query(WorkOrderModel).filter(WorkOrderModel.user_id == user_id).all()

    # @staticmethod
    # def get_conversation_id(db_session: Session, order_id: str) -> str:
    #     work_order = db_session.query(WorkOrderModel).get(order_id)
    #     return work_order.conversation_id if work_order else None
