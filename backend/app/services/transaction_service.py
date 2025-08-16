from ..db import get_database
from ..schemas.transaction import TransactionCreate, TransactionResponse
from ..services.budget_service import BudgetService
from datetime import datetime
from typing import Optional, List

class TransactionService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.transactions
        self.budget_service = BudgetService()

    async def create_transaction(self, transaction: TransactionCreate) -> TransactionResponse:
        transaction_doc = {
            "user_id": transaction.user_id,
            "category": transaction.category,
            "amount": transaction.amount,
            "date": transaction.date or datetime.utcnow(),
            "description": transaction.description
        }

        result = await self.collection.insert_one(transaction_doc)
        transaction_doc["_id"] = result.inserted_id

        # Update spent amount in budget if category exists
        await self.budget_service.update_spent_amount(
            transaction.user_id,
            transaction.category,
            transaction.amount
        )

        return TransactionResponse.from_transaction(transaction_doc)

    async def get_user_transactions(
        self,
        user_id: str,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[TransactionResponse]:
        filter_query = {"user_id": user_id}
        
        if category:
            filter_query["category"] = category
            
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter

        cursor = self.collection.find(filter_query).sort("date", -1)
        transactions = []

        async for transaction_doc in cursor:
            transactions.append(TransactionResponse.from_transaction(transaction_doc))

        return transactions