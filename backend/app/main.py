from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to ZenVest API"}

@app.get("/api")
def read_api():
    return {"message": "Welcome to ZenVest API page"}