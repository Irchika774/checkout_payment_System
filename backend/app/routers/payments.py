from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    EcommerceProduct,
    EcommerceOrder,
    OrderStatus,
)
from app.schemas import PaymentRequest, OrderResponse


# =========================================================
# ROUTER
# =========================================================
# IMPORTANT:
# Do NOT add prefix="/api/payments" here.
#
# main.py already has:
#
# app.include_router(
#     payments.router,
#     prefix="/api/payments",
#     tags=["Payments"]
# )
# =========================================================

router = APIRouter()


# =========================================================
# PROCESS PAYMENT
# =========================================================

@router.post(
    "/process",
    response_model=OrderResponse
)
async def process_payment(
    req: PaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Process a simulated payment for a RESERVED order.

    SUCCESS:
        RESERVED -> PAID
        reserved stock is confirmed/sold.

    FAIL:
        RESERVED -> FAILED
        reserved stock is returned to available stock.

    TIMEOUT / EXPIRED:
        RESERVED -> EXPIRED
        reserved stock is returned to available stock.
    """

    # =====================================================
    # Start database transaction
    # =====================================================

    async with db.begin():

        # =================================================
        # 1. Check idempotency key
        # =================================================

        key_check = await db.execute(
            select(EcommerceOrder).where(
                EcommerceOrder.idempotency_key
                == req.idempotency_key
            )
        )

        existing_order = key_check.scalars().first()

        if existing_order:
            raise HTTPException(
                status_code=400,
                detail="Duplicate payment attempt detected"
            )

        # =================================================
        # 2. Find order
        # =================================================

        result = await db.execute(
            select(EcommerceOrder)
            .where(
                EcommerceOrder.id == req.order_id
            )
            .options(
                selectinload(EcommerceOrder.items)
            )
            .with_for_update()
        )

        order = result.scalars().first()

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        # =================================================
        # 3. Check order status
        # =================================================

        if order.status != OrderStatus.RESERVED:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Order is not in RESERVED state "
                    f"(Current: {order.status})"
                )
            )

        # =================================================
        # 4. Save idempotency key
        # =================================================

        order.idempotency_key = req.idempotency_key

        # Normalize outcome
        outcome = req.simulated_outcome.upper().strip()

        # =================================================
        # 5. PAYMENT SUCCESS
        # =================================================

        if outcome == "SUCCESS":

            order.status = OrderStatus.PAID

            # Confirm reservation.
            #
            # available_stock was already reduced during
            # checkout.
            #
            # Here we only remove the quantity from
            # reserved_stock.

            for item in order.items:

                product_result = await db.execute(
                    select(EcommerceProduct).where(
                        EcommerceProduct.id
                        == item.product_id
                    )
                )

                product = (
                    product_result
                    .scalars()
                    .first()
                )

                if product:

                    product.reserved_stock = (
                        product.reserved_stock or 0
                    )

                    product.reserved_stock = max(
                        0,
                        product.reserved_stock
                        - item.quantity
                    )

        # =================================================
        # 6. PAYMENT FAILED
        # =================================================

        elif outcome in ["FAIL", "FAILED"]:

            order.status = OrderStatus.FAILED

            # Release reserved stock back to available stock

            for item in order.items:

                product_result = await db.execute(
                    select(EcommerceProduct).where(
                        EcommerceProduct.id
                        == item.product_id
                    )
                )

                product = (
                    product_result
                    .scalars()
                    .first()
                )

                if product:

                    product.reserved_stock = (
                        product.reserved_stock or 0
                    )

                    product.available_stock = (
                        product.available_stock or 0
                    )

                    product.reserved_stock = max(
                        0,
                        product.reserved_stock
                        - item.quantity
                    )

                    product.available_stock += (
                        item.quantity
                    )

        # =================================================
        # 7. PAYMENT TIMEOUT / EXPIRED
        # =================================================

        elif outcome in ["TIMEOUT", "EXPIRED"]:

            order.status = OrderStatus.EXPIRED

            # Release reserved stock back to available stock

            for item in order.items:

                product_result = await db.execute(
                    select(EcommerceProduct).where(
                        EcommerceProduct.id
                        == item.product_id
                    )
                )

                product = (
                    product_result
                    .scalars()
                    .first()
                )

                if product:

                    product.reserved_stock = (
                        product.reserved_stock or 0
                    )

                    product.available_stock = (
                        product.available_stock or 0
                    )

                    product.reserved_stock = max(
                        0,
                        product.reserved_stock
                        - item.quantity
                    )

                    product.available_stock += (
                        item.quantity
                    )

        # =================================================
        # 8. INVALID PAYMENT OUTCOME
        # =================================================

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid simulated_outcome. "
                    "Use SUCCESS, FAIL, or TIMEOUT."
                )
            )

    # =====================================================
    # Return updated order
    # =====================================================

    return order