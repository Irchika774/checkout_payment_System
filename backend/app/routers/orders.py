import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import EcommerceOrder, EcommerceOrderItem, EcommerceProduct, OrderStatus

# 1. Initialize the router FIRST
router = APIRouter(prefix="/api/orders", tags=["Orders"])


# Pydantic Schemas for Request Body
class OrderItemSchema(BaseModel):
  product_id: int
  quantity: int
  unit_price: float


class OrderCreateSchema(BaseModel):
  customer_id: Optional[str] = "guest_user"
  total_amount: float
  items: List[OrderItemSchema]


# 2. Endpoints
@router.get("/")
async def get_orders(db: AsyncSession = Depends(get_db)):
  """Fetch all past orders sorted by newest first."""
  result = await db.execute(
      select(EcommerceOrder).order_by(EcommerceOrder.created_at.desc())
  )
  orders = result.scalars().all()
  return orders


@router.post("/checkout")
async def checkout(
    order_data: OrderCreateSchema, db: AsyncSession = Depends(get_db)
):
  """Reserve stock and create a new RESERVED order with 5-minute timer hold."""
  # Step A: Validate stock availability
  for item in order_data.items:
    res = await db.execute(
        select(EcommerceProduct).where(EcommerceProduct.id == item.product_id)
    )
    product = res.scalar_one_or_none()

    if not product:
      raise HTTPException(
          status_code=404, detail=f"Product {item.product_id} not found."
      )

    if product.available_stock < item.quantity:
      raise HTTPException(
          status_code=400,
          detail=(
              f"Insufficient stock for '{product.name}'. Requested:"
              f" {item.quantity}, Available: {product.available_stock}"
          ),
      )

    # Move stock from available -> reserved
    product.available_stock -= item.quantity
    product.reserved_stock += item.quantity

  # Step B: Create Order Record
  new_order = EcommerceOrder(
      id=str(uuid.uuid4()),
      customer_id=order_data.customer_id or "guest_user",
      total_amount=order_data.total_amount,
      status=OrderStatus.RESERVED,
  )
  db.add(new_order)
  await db.flush()

  # Step C: Create Order Item Records
  for item in order_data.items:
    order_item = EcommerceOrderItem(
        order_id=new_order.id,
        product_id=item.product_id,
        quantity=item.quantity,
        unit_price=item.unit_price,
    )
    db.add(order_item)

  await db.commit()
  await db.refresh(new_order)
  return new_order


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, db: AsyncSession = Depends(get_db)):
  """Cancel a RESERVED order and return reserved stock to available stock."""
  res = await db.execute(
      select(EcommerceOrder).where(EcommerceOrder.id == order_id)
  )
  order = res.scalar_one_or_none()

  if not order:
    raise HTTPException(status_code=404, detail="Order not found")

  if order.status != OrderStatus.RESERVED:
    raise HTTPException(
        status_code=400, detail="Only RESERVED orders can be cancelled."
    )

  # Release reserved stock back to available stock
  for item in order.items:
    prod_res = await db.execute(
        select(EcommerceProduct).where(EcommerceProduct.id == item.product_id)
    )
    product = prod_res.scalar_one_or_none()
    if product:
      product.reserved_stock = max(0, product.reserved_stock - item.quantity)
      product.available_stock += item.quantity

  order.status = OrderStatus.CANCELLED
  await db.commit()
  await db.refresh(order)
  return order


@router.post("/{order_id}/refund")
async def refund_order(order_id: str, db: AsyncSession = Depends(get_db)):
  """Simulate a refund for a PAID order and return sold stock to available stock."""
  res = await db.execute(
      select(EcommerceOrder).where(EcommerceOrder.id == order_id)
  )
  order = res.scalar_one_or_none()

  if not order:
    raise HTTPException(status_code=404, detail="Order not found")

  if order.status != OrderStatus.PAID:
    raise HTTPException(
        status_code=400, detail="Only PAID orders can be refunded."
    )

  # Return paid items to available stock
  for item in order.items:
    prod_res = await db.execute(
        select(EcommerceProduct).where(EcommerceProduct.id == item.product_id)
    )
    product = prod_res.scalar_one_or_none()
    if product:
      product.available_stock += item.quantity

  order.status = OrderStatus.REFUNDED
  await db.commit()
  await db.refresh(order)
  return order
