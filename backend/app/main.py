from contextlib import asynccontextmanager
import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure root directory is in sys.path for Vercel serverless execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db
from app.routers import orders, payments, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB connection on startup, safely."""
    try:
        await init_db()
        print("✅ Database connection initialized successfully.")
    except Exception as e:
        print(f"⚠️ Warning: Database initialization skipped or failed: {e}")
    yield
    # You could add cleanup logic here if needed


app = FastAPI(
    title="E-Commerce Storefront API",
    lifespan=lifespan
)

# Allow CORS for frontend (adjust origins if you want stricter rules)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend domain for security
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])


@app.get("/", tags=["Health"])
def read_root():
    return {"message": "Task 02 E-Commerce Storefront API is Live"}
