export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  merchantName: string;
  merchantCategory: string;
  type: 'debit' | 'credit';
  timestamp: string;
}

export interface SpendingRule {
  ruleId: string;
  userId: string;
  name: string;
  category: string;
  threshold: number;
  alertMessage: string;
  createdAt: string;
}

export interface Alert {
  ruleId: string;
  ruleName: string;
  threshold: number;
  transaction: Transaction;
  message: string;
  triggeredAt: string;
}
