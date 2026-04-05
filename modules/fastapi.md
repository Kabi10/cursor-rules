# FastAPI Rules

## Async First
All route handlers must be `async def`. Never mix sync and async in the same handler.

## Pydantic Models
Define request and response models explicitly. Never use `dict` as a route parameter type.
```python
# WRONG
@app.post("/items")
async def create_item(data: dict):
    ...

# RIGHT
class ItemCreate(BaseModel):
    name: str
    price: float

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float

@app.post("/items", response_model=ItemResponse)
async def create_item(data: ItemCreate, db: AsyncSession = Depends(get_db)):
    ...
```

## Dependency Injection
Use `Depends()` for database sessions, auth, and shared resources. Never instantiate shared resources inside route handlers.

## Error Handling
Use `HTTPException` for expected errors. Use a global exception handler for unexpected ones.
```python
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

## Rules
- Use `lifespan` context manager for startup/shutdown logic — never `@app.on_event`.
- Always type-annotate return values on route handlers.
- Keep routers in separate files under `routers/`. Import and `include_router` in `main.py`.
