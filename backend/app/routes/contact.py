from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/contact")
async def submit_contact(form: ContactForm):
    # Here you could:
    # - store in DB
    # - send email via SMTP or service
    print(f"New contact from {form.name} ({form.email}): {form.message}")
    return {"message": "Message received successfully"}
