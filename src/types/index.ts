export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  merchantName: string;
  merchantCategory: string;
  type: 'debit' | 'credit';
  timestamp: string;
}

export interface RuleCondition {
  field: keyof Transaction;
  operator: 'gt' | 'lt' | 'eq' | 'contains';
  value: string | number;
}

export interface SpendingRule {
  ruleId: string;
  name: string;
  condition: RuleCondition;
  alertMessage: string;
  enabled: boolean;
  createdAt: string;
}

export interface Alert {
  ruleId: string;
  ruleName: string;
  transaction: Transaction;
  message: string;
  triggeredAt: string;
}
