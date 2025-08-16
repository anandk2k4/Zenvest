export interface Transaction {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    date: string;
    description?: string;
  }
  
  export interface TransactionCreate {
    user_id: string;
    category: string;
    amount: number;
    description?: string;
    date?: string;
  }
  