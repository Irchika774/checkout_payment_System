from contextlib import asynccontextmanager
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Ensure project root is available for imports when running on Vercel
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)


from app.database import init_db
from app.routers import orders, payments, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize the database when the FastAPI application starts.
    """

    try:
        await init_db()
        print("✅ Database connection initialized successfully.")

    except Exception as e:
        # Do not prevent the API from starting if DB initialization fails.
        print(f"⚠️ Database initialization failed: {e}")

    yield


app = FastAPI(
    title="E-Commerce Storefront API",
    version="0.1.0",
    description="E-Commerce Storefront API"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API ROUTERS
# ---------------------------------------------------------
#
# IMPORTANT:
# The /api/... prefixes are defined HERE.
#
# Therefore products.py, orders.py and payments.py
# must NOT repeat these prefixes.
#
# ---------------------------------------------------------

app.include_router(
    products.router,
    prefix="/api/products",
    tags=["Products"]
)

app.include_router(
    orders.router,
    prefix="/api/orders",
    tags=["Orders"]
)

app.include_router(
    payments.router,
    prefix="/api/payments",
    tags=["Payments"]
)


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/", tags=["Health"])
async def read_root():
    return {
        "message": "Task 02 E-Commerce Storefront API is Live"
    }