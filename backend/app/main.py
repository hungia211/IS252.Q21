from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.rough_set import router as rough_set_router
from app.routers.classification import router as classification_router
from app.routers.pre_processing_router import router as pre_processing_router
from app.routers.frequent_itemsets_and_rules_router import router as frequent_itemsets_and_rules_router


app = FastAPI(title="Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rough_set_router)
app.include_router(classification_router)
app.include_router(pre_processing_router)
app.include_router(frequent_itemsets_and_rules_router)

@app.get("/")
def root():
    return {"message": "Xin chào các bạn!"}

