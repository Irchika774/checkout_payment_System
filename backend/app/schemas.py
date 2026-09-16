from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models import OrderStatus

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    price: float
    available_stock: int
    reserved_stock: int
    image_url: Optional[str]

    class Config:
        from_attributes = True

class CartItemRequest(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    customer_id: str
    items: List[CartItemRequest]

class PaymentRequest(BaseModel):
    order_id: str
    idempotency_key: str
    simulated_outcome: str  # SUCCESS, FAIL, TIMEOUT

class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True