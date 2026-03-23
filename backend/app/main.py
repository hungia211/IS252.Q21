from fastapi import FastAPI
from app.routers import users, upload
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(upload.router)

@app.get("/")
def root():
    return {"message": "Xin chào các bạn!"}

@app.get("/test")
async def test_api():
    return {"message": "API hoạt động tốt!"}