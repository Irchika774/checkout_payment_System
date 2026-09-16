
from datetime import datetime, timezone
import enum
import uuid
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class OrderStatus(str, enum.Enum):
  PENDING = "PENDING"
  RESERVED = "RESERVED"
  PAID = "PAID"
  FAILED = "FAILED"
  EXPIRED = "EXPIRED"
  CANCELLED = "CANCELLED"
  REFUNDED = "REFUNDED"


class EcommerceProduct(Base):
  __tablename__ = "ecommerce_products"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String, nullable=False)
  category = Column(String, nullable=False, index=True)
  description = Column(String, nullable=True)
  price = Column(Float, nullable=False)
  available_stock = Column(Integer, default=0)
  reserved_stock = Column(Integer, default=0)
  image_url = Column(String, nullable=True)


class EcommerceOrder(Base):
  __tablename__ = "ecommerce_orders"

  id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
  customer_id = Column(String, nullable=False)
  total_amount = Column(Float, nullable=False)
  status = Column(
      Enum(OrderStatus, native_enum=False), default=OrderStatus.RESERVED
  )
  idempotency_key = Column(String, unique=True, nullable=True)
  created_at = Column(
      DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
  )

  # lazy="selectin" is REQUIRED for async SQLAlchemy relationship serialization
  items = relationship(
      "EcommerceOrderItem",
      back_populates="order",
      cascade="all, delete-orphan",
      lazy="selectin",
  )


class EcommerceOrderItem(Base):
  __tablename__ = "ecommerce_order_items"

  id = Column(Integer, primary_key=True, index=True)
  order_id = Column(
      String, ForeignKey("ecommerce_orders.id", ondelete="CASCADE")
  )
  product_id = Column(Integer, ForeignKey("ecommerce_products.id"))
  quantity = Column(Integer, nullable=False)
  unit_price = Column(Float, nullable=False)

  order = relationship(
      "EcommerceOrder", back_populates="items", lazy="selectin"
  )
  product = relationship("EcommerceProduct", lazy="selectin")