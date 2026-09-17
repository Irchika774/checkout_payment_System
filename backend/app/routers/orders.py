import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    EcommerceOrder,
    EcommerceOrderItem,
    EcommerceProduct,
    OrderStatus,
)


# =========================================================
# ROUTER
# =========================================================
# IMPORTANT:
# Do NOT add prefix="/api/orders" here.
#
# main.py already has:
# app.include_router(
#     orders.router,
#     prefix="/api/orders",
#     tags=["Orders"]
# )
# =========================================================

router = APIRouter()


# =========================================================
# PYDANTIC SCHEMAS
# =========================================================

class OrderItemSchema(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderCreateSchema(BaseModel):
    customer_id: Optional[str] = "guest_user"
    total_amount: float
    items: List[OrderItemSchema]


# =========================================================
# GET ALL ORDERS
# =========================================================

@router.get("/")
async def get_orders(
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all past orders sorted by newest first.
    """

    result = await db.execute(
        select(EcommerceOrder).order_by(
            EcommerceOrder.created_at.desc()
        )
    )

    orders = result.scalars().all()

    return orders


# =========================================================
# CHECKOUT
# =========================================================

@router.post("/checkout")
async def checkout(
    order_data: OrderCreateSchema,
    db: AsyncSession = Depends(get_db)
):
    """
    Reserve stock and create a new RESERVED order.

    The stock is moved from:
        available_stock -> reserved_stock

    The payment process can later change the order
    from RESERVED to PAID.
    """

    # -----------------------------------------------------
    # Validate order has items
    # -----------------------------------------------------

    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item."
        )

    # -----------------------------------------------------
    # Validate quantities
    # -----------------------------------------------------

    for item in order_data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Quantity for product "
                    f"{item.product_id} must be greater than 0."
                )
            )

        if item.unit_price < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unit price for product "
                    f"{item.product_id} cannot be negative."
                )
            )

    # -----------------------------------------------------
    # Step A:
    # Validate stock availability
    # -----------------------------------------------------

    products_to_update = []

    for item in order_data.items:

        result = await db.execute(
            select(EcommerceProduct).where(
                EcommerceProduct.id == item.product_id
            )
        )

        product = result.scalar_one_or_none()

        # Product does not exist
        if not product:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product {item.product_id} not found."
                )
            )

        # Not enough stock
        if product.available_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for "
                    f"'{product.name}'. "
                    f"Requested: {item.quantity}, "
                    f"Available: {product.available_stock}"
                )
            )

        products_to_update.append(
            (product, item.quantity)
        )

    # -----------------------------------------------------
    # Step B:
    # Move stock from available -> reserved
    # -----------------------------------------------------

    for product, quantity in products_to_update:

        product.available_stock -= quantity

        # Protect against None if the database value is NULL
        product.reserved_stock = (
            product.reserved_stock or 0
        )

        product.reserved_stock += quantity

    # -----------------------------------------------------
    # Step C:
    # Create order
    # -----------------------------------------------------

    new_order = EcommerceOrder(
        id=str(uuid.uuid4()),
        customer_id=(
            order_data.customer_id
            or "guest_user"
        ),
        total_amount=order_data.total_amount,
        status=OrderStatus.RESERVED,
    )

    db.add(new_order)

    # Flush so new_order.id is available
    await db.flush()

    # -----------------------------------------------------
    # Step D:
    # Create order items
    # -----------------------------------------------------

    for item in order_data.items:

        order_item = EcommerceOrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )

        db.add(order_item)

    # -----------------------------------------------------
    # Step E:
    # Save everything
    # -----------------------------------------------------

    try:

        await db.commit()

    except Exception:
        await db.rollback()
        raise

    # -----------------------------------------------------
    # Refresh order
    # -----------------------------------------------------

    await db.refresh(new_order)

    return new_order


# =========================================================
# CANCEL ORDER
# =========================================================

@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a RESERVED order.

    Reserved stock is returned to available stock.
    """

    # -----------------------------------------------------
    # Find order
    # -----------------------------------------------------

    result = await db.execute(
        select(EcommerceOrder).where(
            EcommerceOrder.id == order_id
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # -----------------------------------------------------
    # Validate order status
    # -----------------------------------------------------

    if order.status != OrderStatus.RESERVED:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only RESERVED orders "
                "can be cancelled."
            )
        )

    # -----------------------------------------------------
    # Release reserved stock
    # -----------------------------------------------------

    for item in order.items:

        product_result = await db.execute(
            select(EcommerceProduct).where(
                EcommerceProduct.id == item.product_id
            )
        )

        product = product_result.scalar_one_or_none()

        if product:

            product.reserved_stock = (
                product.reserved_stock or 0
            )

            product.reserved_stock = max(
                0,
                product.reserved_stock - item.quantity
            )

            product.available_stock = (
                product.available_stock or 0
            )

            product.available_stock += item.quantity

    # -----------------------------------------------------
    # Update order status
    # -----------------------------------------------------

    order.status = OrderStatus.CANCELLED

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    try:

        await db.commit()

    except Exception:
        await db.rollback()
        raise

    await db.refresh(order)

    return order


# =========================================================
# REFUND ORDER
# =========================================================

@router.post("/{order_id}/refund")
async def refund_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate a refund for a PAID order.

    The purchased stock is returned to available stock.
    """

    # -----------------------------------------------------
    # Find order
    # -----------------------------------------------------

    result = await db.execute(
        select(EcommerceOrder).where(
            EcommerceOrder.id == order_id
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # -----------------------------------------------------
    # Validate order status
    # -----------------------------------------------------

    if order.status != OrderStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Only PAID orders can be refunded."
        )

    # -----------------------------------------------------
    # Return stock
    # -----------------------------------------------------

    for item in order.items:

        product_result = await db.execute(
            select(EcommerceProduct).where(
                EcommerceProduct.id == item.product_id
            )
        )

        product = product_result.scalar_one_or_none()

        if product:

            product.available_stock = (
                product.available_stock or 0
            )

            product.available_stock += item.quantity

    # -----------------------------------------------------
    # Update order status
    # -----------------------------------------------------

    order.status = OrderStatus.REFUNDED

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    try:

        await db.commit()

    except Exception:
        await db.rollback()
        raise

    await db.refresh(order)

    return order