from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import EcommerceProduct, EcommerceOrder, OrderStatus
from app.schemas import PaymentRequest, OrderResponse

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/process", response_model=OrderResponse)
async def process_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        # Check idempotency duplicate attempts
        key_check = await db.execute(
            select(EcommerceOrder).where(EcommerceOrder.idempotency_key == req.idempotency_key)
        )
        if key_check.scalars().first():
            raise HTTPException(status_code=400, detail="Duplicate payment attempt detected")

        result = await db.execute(
            select(EcommerceOrder).where(EcommerceOrder.id == req.order_id).options(selectinload(EcommerceOrder.items)).with_for_update()
        )
        order = result.scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status != OrderStatus.RESERVED:
            raise HTTPException(status_code=400, detail=f"Order is not in RESERVED state (Current: {order.status})")

        order.idempotency_key = req.idempotency_key
        outcome = req.simulated_outcome.upper()

        if outcome == "SUCCESS":
            order.status = OrderStatus.PAID
            # Confirm reservation: deduct from reserved stock
            for item in order.items:
                p_res = await db.execute(select(EcommerceProduct).where(EcommerceProduct.id == item.product_id))
                prod = p_res.scalars().first()
                if prod:
                    prod.reserved_stock = max(0, prod.reserved_stock - item.quantity)

        elif outcome in ["FAIL", "FAILED"]:
            order.status = OrderStatus.FAILED
            # Release reserved stock back to available stock
            for item in order.items:
                p_res = await db.execute(select(EcommerceProduct).where(EcommerceProduct.id == item.product_id))
                prod = p_res.scalars().first()
                if prod:
                    prod.reserved_stock = max(0, prod.reserved_stock - item.quantity)
                    prod.available_stock += item.quantity

        elif outcome in ["TIMEOUT", "EXPIRED"]:
            order.status = OrderStatus.EXPIRED
            # Release reserved stock on timeout
            for item in order.items:
                p_res = await db.execute(select(EcommerceProduct).where(EcommerceProduct.id == item.product_id))
                prod = p_res.scalars().first()
                if prod:
                    prod.reserved_stock = max(0, prod.reserved_stock - item.quantity)
                    prod.available_stock += item.quantity
        else:
            raise HTTPException(status_code=400, detail="Invalid simulated_outcome. Use SUCCESS, FAIL, or TIMEOUT.")

    return order