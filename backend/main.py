from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db

# Automatically create the database tables on application startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management API")

# Enable CORS so your React frontend can safely communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easier testing/deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Rule Check: Check if SKU already exists
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()




@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Rule Check: Check if email already exists
    db_customer = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_customer = models.Customer(**customer.dict())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()




@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Verify Customer Exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if not order_data.items:
        raise HTTPException(status_code=400, detail="An order must contain at least one item")

    # Initialize order row to generate an ID
    new_order = models.Order(customer_id=order_data.customer_id, total_price=0.0)
    db.add(new_order)
    db.flush()  

    calculated_total = 0.0

    # 2. Process items step-by-step inside a safe database transaction
    for item in order_data.items:
        # .with_for_update() locks the row so two requests can't modify the same stock simultaneously
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        
        if not product:
            db.rollback()  # Undo everything done in this request so far
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        
        # Core Business Rule Validation: Stock Check
        if product.stock < item.quantity:
            db.rollback()  # Cancel the order process completely
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}, Requested: {item.quantity}"
            )
        
        # Deduct inventory stock automatically
        product.stock -= item.quantity
        item_total = product.price * item.quantity
        calculated_total += item_total

        # Create the linkage row
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )
        db.add(order_item)

    # Update final order total and commit the transaction safely
    new_order.total_price = calculated_total
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()