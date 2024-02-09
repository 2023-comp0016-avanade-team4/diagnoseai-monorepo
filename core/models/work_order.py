from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, declarative_base, relationship, mapped_column
from uuid import uuid4

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
