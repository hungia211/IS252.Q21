from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.rough_set import router as rough_set_router


app = FastAPI(title="Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rough_set_router)

@app.get("/")
def root():
    return {"message": "Xin chào các bạn!"}

