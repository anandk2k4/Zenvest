from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from ..schemas.transaction import TransactionCreate, TransactionResponse
from ..services.transaction_service import TransactionService
from datetime import datetime

router = APIRouter()

def get_transaction_service():
    return TransactionService()

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        created_transaction = await service.create_transaction(transaction)
        return created_transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    user_id: str = Query(...),
    category: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    service: TransactionService = Depends(get_transaction_service)
):
    try:
        transactions = await service.get_user_transactions(
            user_id, category, start_date, end_date
        )
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))