from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str
    sku: str
    price: float
    stock: int

class ProductCreate(ProductBase):
    pass  # Used when creating a new product (expects name, sku, price, stock)

class ProductResponse(ProductBase):
    id: int  # Includes the database auto-generated ID when sending data back

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models smoothly


# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str
    email: EmailStr  # Automatically validates proper email structure (e.g., example@test.com)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]  # Expects a list of nested product IDs and quantities

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_price: float
    created_at: datetime

    class Config:
        from_attributes = True