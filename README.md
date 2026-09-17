# Task 02 — Full-Stack E-Commerce Storefront System

## Techloom.ai Practical Assessment — Task 02 Submission

**Live Storefront Frontend:**
https://checkout-payment-system-uw8a.vercel.app/

**Live Backend API:**
https://checkout-payment-system-mh5f.vercel.app/

**Interactive API Documentation (Swagger):**
https://checkout-payment-system-mh5f.vercel.app/docs

---

# 📌 Project Overview

Task 02 is a full-stack e-commerce storefront system developed as part of the **Techloom.ai Software Engineering Intern Practical Assessment**.

The application provides a complete shopping workflow including:

* Dynamic product search
* Multi-criteria product filtering
* Shopping cart management
* Stock validation
* Real-time stock reservation during checkout
* Mock payment processing
* Payment success, failure, and timeout handling
* Order lifecycle management
* Order cancellation
* Refund processing
* Idempotency and duplicate-payment prevention
* RESTful backend APIs
* Interactive Swagger API documentation

The application is designed with a clear separation between the React frontend, FastAPI backend, and PostgreSQL database.

---

# 🚀 Live Deployment

| Component                 | URL                                                  | Hosting           |
| ------------------------- | ---------------------------------------------------- | ----------------- |
| Storefront Frontend       | https://checkout-payment-system-uw8a.vercel.app/     | Vercel            |
| Backend API               | https://checkout-payment-system-mh5f.vercel.app/     | Vercel            |
| Swagger API Documentation | https://checkout-payment-system-mh5f.vercel.app/docs | FastAPI / OpenAPI |

---

# 🛠️ Technology Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* JavaScript
* REST API integration
* Client-side state management

## Backend

* Python 3.12
* FastAPI
* Pydantic
* SQLAlchemy
* Async SQLAlchemy
* asyncpg

## Database

* PostgreSQL
* Supabase
* Session Pooler
* Port 5432

## Deployment

* Vercel
* Vercel Serverless Python Runtime
* Vercel static deployment for React/Vite frontend

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User / Browser  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React + Vite SPA   │
                         │   Tailwind CSS UI    │
                         └──────────┬───────────┘
                                    │
                              REST API Requests
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │   Python 3.12        │
                         └──────────┬───────────┘
                                    │
                           SQLAlchemy Async ORM
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Supabase PostgreSQL  │
                         │   Product / Orders   │
                         └──────────────────────┘
```

---

# 📁 Project Directory Structure

```text
task-02/
│
├── backend/
│   │
│   ├── api/
│   │   └── index.py
│   │       # Vercel serverless entry point
│   │
│   ├── app/
│   │   ├── main.py
│   │   │   # FastAPI application initialization and CORS
│   │   │
│   │   ├── database.py
│   │   │   # Supabase PostgreSQL async engine and sessions
│   │   │
│   │   ├── models.py
│   │   │   # SQLAlchemy database models
│   │   │
│   │   ├── schemas.py
│   │   │   # Pydantic request and response schemas
│   │   │
│   │   └── routers/
│   │       ├── products.py
│   │       ├── orders.py
│   │       └── payments.py
│   │
│   ├── requirements.txt
│   │   # Python dependencies
│   │
│   └── vercel.json
│       # Vercel deployment configuration
│
└── frontend/
    │
    ├── src/
    │   ├── components/
    │   │   # Navbar, catalog, cart, checkout,
    │   │   # payment modal, order history, etc.
    │   │
    │   ├── App.jsx
    │   │   # Main application state and API orchestration
    │   │
    │   └── main.jsx
    │
    ├── package.json
    ├── vercel.json
    │   # SPA rewrite configuration
    │
    └── vite.config.js
```

---

# ✨ Core Features

## 1. Product Catalogue

The storefront displays products retrieved dynamically from the FastAPI backend.

Each product can contain:

* Product name
* Description
* Category
* Price
* Available stock
* Product image

---

## 2. Dynamic Product Search

Users can search for products using the search field.

The backend performs the search against product information and returns matching products.

Example:

```text
Search: headphones

        ↓

Backend API

        ↓

Matching products
```

---

# 🔎 3. Multi-Criteria Filtering

The storefront supports multiple filtering options.

Users can filter products by:

* Product category
* Minimum price
* Maximum price
* Stock availability
* Search keyword

Example:

```text
Search
   +
Category
   +
Min Price
   +
Max Price
   +
In Stock Only
        ↓
Filtered Product Results
```

---

# 🛒 4. Shopping Cart

Users can:

* Add products to the cart
* Increase product quantity
* Decrease product quantity
* Remove products
* View cart contents
* View the calculated total
* Proceed to checkout

The cart is managed on the frontend until the checkout request is submitted.

---

# 📦 5. Stock Reservation

When checkout is initiated, the backend validates the requested product quantities against the current available inventory.

If sufficient stock exists:

```text
Available Stock
       ↓
Stock Validation
       ↓
Create Order
       ↓
Order = RESERVED
       ↓
Inventory Reserved
```

This prevents customers from completing orders when there is insufficient inventory.

---

# ⏱️ 6. Reservation Expiration

Reserved inventory is designed to be held for a limited payment period.

The reservation period is:

```text
300 seconds (5 minutes)
```

If payment is not successfully completed within the applicable reservation flow, the reserved inventory can be released according to the payment/order state handling.

---

# 💳 7. Mock Payment Gateway

The application includes an interactive mock payment gateway.

Users can simulate three payment outcomes:

```text
SUCCESS
FAILED
TIMEOUT
```

This allows the complete payment lifecycle to be tested without using a real payment provider.

---

# ✅ 8. Successful Payment

When the simulated payment result is:

```text
SUCCESS
```

The order transitions from:

```text
RESERVED
     ↓
PAID
```

The reserved inventory is finalized as sold inventory.

---

# ❌ 9. Failed Payment

When the simulated payment result is:

```text
FAILED
```

The order transitions from:

```text
RESERVED
     ↓
FAILED
```

The reserved inventory is returned to available stock.

```text
Reserved Stock
      ↓
Payment Failed
      ↓
Available Stock
```

---

# ⏰ 10. Payment Timeout

When the simulated payment result is:

```text
TIMEOUT
```

The order transitions to:

```text
RESERVED
     ↓
EXPIRED
```

The reserved inventory is released back to available stock.

---

# 🔐 11. Idempotency and Duplicate Prevention

The payment flow uses an **idempotency key** to prevent duplicate payment processing.

The backend checks whether an idempotency key has already been used before processing a payment.

```text
Payment Request
       ↓
Check Idempotency Key
       ↓
Already Used?
   ↙         ↘
 YES          NO
 ↓             ↓
Reject       Process
```

This helps prevent the same payment request from being processed multiple times.

The backend also rejects attempts to process payments for orders that are no longer in the appropriate payment state.

---

# 📋 12. Order History

Users can access their order history from the storefront.

Order information includes the order status and relevant order details.

Supported order states include:

```text
RESERVED
PAID
FAILED
EXPIRED
CANCELLED
REFUNDED
```

---

# 🚫 13. Order Cancellation

Orders that are still in the `RESERVED` state can be cancelled.

Cancellation flow:

```text
RESERVED
    ↓
Cancel Order
    ↓
CANCELLED
    ↓
Reserved Stock Released
```

The inventory is returned to the available stock.

---

# 💰 14. Refund Processing

A successfully paid order can be submitted for a refund.

Refund flow:

```text
PAID
 ↓
Request Refund
 ↓
REFUNDED
 ↓
Inventory Returned
```

This provides a complete simulated order lifecycle from reservation through payment and refund.

---

# 🔌 API Endpoints

## Products

### Get Products

```http
GET /api/products/
```

Supports product search and filtering parameters.

### Get Product

```http
GET /api/products/{product_id}
```

Returns information about a specific product.

---

## Orders

### Get Orders

```http
GET /api/orders/
```

Returns the available orders.

### Checkout

```http
POST /api/orders/checkout
```

Creates an order and reserves the required inventory.

### Cancel Order

```http
POST /api/orders/{order_id}/cancel
```

Cancels a reserved order and releases the reserved inventory.

### Refund Order

```http
POST /api/orders/{order_id}/refund
```

Processes a refund for a paid order.

---

## Payments

### Process Payment

```http
POST /api/payments/process
```

Processes the mock payment request.

Supported outcomes:

```text
SUCCESS
FAILED
TIMEOUT
```

---

## Health Check

```http
GET /
```

Used to verify that the backend service is running.

---

# 📖 Swagger API Documentation

FastAPI automatically generates interactive API documentation.

**Swagger UI:**

https://checkout-payment-system-mh5f.vercel.app/docs

The Swagger interface can be used to:

* Explore API endpoints
* View request schemas
* View response schemas
* Send test requests
* Test product operations
* Test checkout
* Test payment processing
* Test cancellation
* Test refunds

---

# ⚙️ Environment Variables

## Backend

Create:

```text
task-02/backend/.env
```

Add:

```env
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

### Database Configuration

The application uses:

```text
PostgreSQL
Supabase
asyncpg
SQLAlchemy Async ORM
Port 5432
```

The `postgresql+asyncpg://` format is required because the application uses SQLAlchemy's asynchronous PostgreSQL driver.

**Never commit the actual database password to GitHub.**

---

# 🌐 Frontend Environment Variable

Create:

```text
task-02/frontend/.env.local
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For the deployed frontend:

```env
VITE_API_BASE_URL=https://checkout-payment-system-mh5f.vercel.app
```

The production frontend communicates with the deployed FastAPI backend through this environment variable.

---

# 🚀 Local Setup

## Prerequisites

Install:

* Python 3.12+
* Node.js
* npm
* Git
* A PostgreSQL/Supabase database

---

## 1. Clone the Repository

```bash
git clone https://github.com/Irchika774/techloom-intern-assessment.git
cd techloom-intern-assessment
```

---

# 🐍 2. Start the Backend

Navigate to the backend:

```bash
cd task-02/backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the `.env` file:

```env
DATABASE_URL=your_postgresql_database_url
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

# ⚛️ 3. Start the Frontend

Open another terminal.

Navigate to:

```bash
cd task-02/frontend
```

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the Vite development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🧪 Feature Testing

## Test 1 — Product Search

1. Open the storefront.
2. Enter a product name in the search field.
3. Confirm that matching products are displayed.

---

## Test 2 — Category Filtering

1. Select a product category.
2. Confirm that the catalogue updates.
3. Verify that products outside the selected category are excluded.

---

## Test 3 — Price Filtering

1. Enter a minimum price.
2. Enter a maximum price.
3. Confirm that products outside the selected price range are excluded.

---

## Test 4 — In-Stock Filtering

1. Enable the **In Stock Only** option.
2. Confirm that only products with available inventory are displayed.

---

## Test 5 — Add to Cart

1. Select a product.
2. Click **Add to Cart**.
3. Open the cart.
4. Confirm that the product appears.
5. Change the quantity.
6. Confirm that the cart total updates.

---

## Test 6 — Checkout

1. Add products to the cart.
2. Open the cart.
3. Select **Proceed to Checkout**.
4. Confirm that the backend validates stock.
5. Confirm that an order is created.
6. Confirm that the order enters the `RESERVED` state.

---

## Test 7 — Successful Payment

Select:

```text
SUCCESS
```

Expected result:

```text
RESERVED
    ↓
PAID
```

The reserved inventory is finalized.

---

## Test 8 — Failed Payment

Select:

```text
FAILED
```

Expected result:

```text
RESERVED
    ↓
FAILED
```

The reserved inventory is returned to available stock.

---

## Test 9 — Payment Timeout

Select:

```text
TIMEOUT
```

Expected result:

```text
RESERVED
    ↓
EXPIRED
```

The reserved inventory is released.

---

## Test 10 — Duplicate Payment

1. Process a payment with an idempotency key.
2. Attempt to process another payment using the same idempotency key.
3. Confirm that the duplicate payment request is rejected.

Expected behavior:

```text
First Request
     ↓
Payment Processed

Second Request
     ↓
Duplicate Detected
     ↓
Rejected
```

---

## Test 11 — Cancel Order

1. Create an order.
2. Keep the order in the `RESERVED` state.
3. Select **Cancel Order**.
4. Confirm the order changes to:

```text
CANCELLED
```

5. Confirm the reserved stock is returned.

---

## Test 12 — Refund

1. Create an order.
2. Complete payment successfully.
3. Confirm that the order is `PAID`.
4. Select **Request Refund**.
5. Confirm that the order changes to:

```text
REFUNDED
```

6. Confirm that inventory is returned according to the refund flow.

---

# 🔄 Order Lifecycle

The application supports the following order lifecycle:

```text
                    ┌───────────────┐
                    │   RESERVED    │
                    └───────┬───────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
          SUCCESS         FAILED        TIMEOUT
              │             │              │
              ▼             ▼              ▼
            PAID          FAILED         EXPIRED
              │
              ▼
           REFUNDED
```

A reserved order can also be cancelled:

```text
RESERVED
   │
   ▼
CANCELLED
```

---

# 🔒 Data Integrity

The application maintains consistency between:

* Product inventory
* Reserved inventory
* Orders
* Order items
* Payment status

Critical operations are handled through database transactions.

Payment processing also uses row-level locking for the relevant order to reduce the risk of conflicting concurrent updates.

---

# 🧠 Technical Design Decisions

## FastAPI

FastAPI was selected for:

* High-performance API development
* Asynchronous request handling
* Automatic OpenAPI documentation
* Request validation
* Dependency injection

## SQLAlchemy Async ORM

SQLAlchemy's asynchronous ORM is used to communicate with PostgreSQL without blocking database operations.

## PostgreSQL

PostgreSQL provides transactional support and database-level locking required for maintaining inventory and order consistency.

## Supabase

Supabase provides the hosted PostgreSQL database used by the application.

## React + Vite

React provides the component-based frontend architecture while Vite provides fast development and production builds.

## Tailwind CSS

Tailwind CSS is used to build the responsive storefront interface.

---

# ☁️ Deployment Architecture

```text
┌─────────────────────────────┐
│      Vercel Frontend        │
│       React + Vite          │
└──────────────┬──────────────┘
               │
               │ HTTPS REST API
               ▼
┌─────────────────────────────┐
│       Vercel Backend        │
│      FastAPI Serverless     │
└──────────────┬──────────────┘
               │
               │ Async PostgreSQL
               ▼
┌─────────────────────────────┐
│      Supabase PostgreSQL    │
└─────────────────────────────┘
```

---

# 🔐 Security Considerations

The project follows several basic security practices:

* Database credentials are stored through environment variables.
* `.env` files should not be committed to GitHub.
* Product stock is validated on the backend.
* Payment state is validated on the backend.
* Duplicate payment requests are protected using idempotency keys.
* Database transactions are used for critical operations.
* Row-level locking is used during payment processing.
* API input is validated using Pydantic.

For a larger production system, additional security measures could include:

* User authentication
* Role-based authorization
* Restricted CORS origins
* Rate limiting
* Secure payment gateway integration
* HTTPS enforcement
* Security monitoring
* Automated dependency scanning

---

# 📊 Example Business Rules

| Scenario                        | Expected Result                              |
| ------------------------------- | -------------------------------------------- |
| Product has insufficient stock  | Checkout rejected                            |
| Valid checkout                  | Order becomes `RESERVED`                     |
| Payment `SUCCESS`               | Order becomes `PAID`                         |
| Payment `FAILED`                | Order becomes `FAILED`, stock released       |
| Payment `TIMEOUT`               | Order becomes `EXPIRED`, stock released      |
| Reserved order cancelled        | Order becomes `CANCELLED`, stock released    |
| Paid order refunded             | Order becomes `REFUNDED`, inventory returned |
| Duplicate idempotency key       | Payment request rejected                     |
| Payment for invalid order state | Payment request rejected                     |

---

# 🔮 Future Improvements

Potential improvements for a production-scale version include:

* Customer authentication
* User accounts
* Admin dashboard
* Product administration
* Real payment gateway integration
* Automated reservation expiry jobs
* Email order notifications
* Product image management
* Pagination
* Automated unit tests
* Integration tests
* CI/CD pipeline
* Redis caching
* Rate limiting
* Centralized logging
* Monitoring and alerting
* Database migrations using Alembic

---

# 👩‍💻 Author

**P. M. G. Irchika**

Software Engineer — Full-Stack Developer

**GitHub:**
https://github.com/Irchika774

**LinkedIn:**
https://www.linkedin.com/in/warushi-irchika-013459271/

---

# 📬 Submission Links

### Storefront Frontend

https://checkout-payment-system-uw8a.vercel.app/

### Backend API

https://checkout-payment-system-mh5f.vercel.app/

### Swagger Documentation

https://checkout-payment-system-mh5f.vercel.app/docs

### GitHub Repository

https://github.com/Irchika774/techloom-intern-assessment

---

# ✅ Task 02 Submission Checklist

* [x] React/Vite storefront
* [x] FastAPI backend
* [x] PostgreSQL database
* [x] Supabase integration
* [x] Product catalogue
* [x] Product search
* [x] Multi-criteria filtering
* [x] Shopping cart
* [x] Stock validation
* [x] Stock reservation
* [x] Mock payment gateway
* [x] Successful payment flow
* [x] Failed payment flow
* [x] Timeout/expiration flow
* [x] Idempotency protection
* [x] Duplicate payment prevention
* [x] Order history
* [x] Order cancellation
* [x] Refund handling
* [x] Swagger API documentation
* [x] Backend deployed to Vercel
* [x] Frontend deployed to Vercel
* [x] Local setup documentation
* [x] Environment variable documentation
* [x] Feature testing documentation

---

## Thank You

Thank you for reviewing my **Techloom.ai Practical Assessment — Task 02** submission.
