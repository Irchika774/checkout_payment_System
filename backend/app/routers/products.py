from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import EcommerceProduct
from app.schemas import ProductResponse


# IMPORTANT:
# Do NOT put prefix="/api/products" here.
# The prefix is already added in main.py.
router = APIRouter()


@router.get(
    "/",
    response_model=List[ProductResponse]
)
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all products with optional filtering.
    """

    query = select(EcommerceProduct)

    # -----------------------------------------------------
    # Search
    # -----------------------------------------------------

    if search:
        query = query.where(
            or_(
                EcommerceProduct.name.ilike(
                    f"%{search}%"
                ),
                EcommerceProduct.description.ilike(
                    f"%{search}%"
                )
            )
        )

    # -----------------------------------------------------
    # Category
    # -----------------------------------------------------

    if category and category != "All":
        query = query.where(
            EcommerceProduct.category == category
        )

    # -----------------------------------------------------
    # Minimum price
    # -----------------------------------------------------

    if min_price is not None:
        query = query.where(
            EcommerceProduct.price >= min_price
        )

    # -----------------------------------------------------
    # Maximum price
    # -----------------------------------------------------

    if max_price is not None:
        query = query.where(
            EcommerceProduct.price <= max_price
        )

    # -----------------------------------------------------
    # Stock
    # -----------------------------------------------------

    if in_stock is True:
        query = query.where(
            EcommerceProduct.available_stock > 0
        )

    # -----------------------------------------------------
    # Execute query
    # -----------------------------------------------------

    result = await db.execute(query)

    products = result.scalars().all()

    return products


@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get one product by ID.
    """

    result = await db.execute(
        select(EcommerceProduct).where(
            EcommerceProduct.id == product_id
        )
    )

    product = result.scalars().first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product