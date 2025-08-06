from fastapi.middleware.cors import CORSMiddleware
from app.routes import contact
from fastapi import FastAPI

app = FastAPI()

app.include_router(contact.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)
