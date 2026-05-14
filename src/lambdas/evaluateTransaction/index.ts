import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { Transaction, SpendingRule, Alert } from '../../types';
import { docClient } from '../../utils/dynamo';

const sns = new SNSClient({});

const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE!;
const SPENDING_RULES_TABLE = process.env.SPENDING_RULES_TABLE!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

class ValidationError extends Error {}

function parseTransaction(body: string | null): Transaction {
  if (!body) throw new ValidationError('Missing request body');

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    throw new ValidationError('Invalid JSON');
  }

  const t = raw as Record<string, unknown>;
  if (typeof t.id !== 'string') throw new ValidationError('Missing or invalid: id');
  if (typeof t.userId !== 'string') throw new ValidationError('Missing or invalid: userId');
  if (typeof t.accountId !== 'string') throw new ValidationError('Missing or invalid: accountId');
  if (typeof t.amount !== 'number') throw new ValidationError('Missing or invalid: amount');
  if (typeof t.merchantName !== 'string') throw new ValidationError('Missing or invalid: merchantName');
  if (typeof t.merchantCategory !== 'string') throw new ValidationError('Missing or invalid: merchantCategory');
  if (t.type !== 'debit' && t.type !== 'credit') throw new ValidationError('Missing or invalid: type');
  if (typeof t.timestamp !== 'string') throw new ValidationError('Missing or invalid: timestamp');

  return t as unknown as Transaction;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  let transaction: Transaction;
  try {
    transaction = parseTransaction(event.body);
    console.log('[parseTransaction] parsed transaction:', transaction);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
    }
    throw err;
  }

  try {
    const queryParams = {
      TableName: SPENDING_RULES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': transaction.userId },
    };
    console.log('[queryRules] query params:', queryParams);

    const rulesResult = await docClient.send(new QueryCommand(queryParams));
    console.log('[queryRules] raw items returned:', rulesResult.Items);

    const rules = (rulesResult.Items ?? []) as SpendingRule[];
    const firedRules = rules.filter((rule) => {
      const fired = rule.category === transaction.merchantCategory && transaction.amount > rule.threshold;
      console.log('[evaluateRule] rule:', rule.ruleId, '| category:', rule.category, '| threshold:', rule.threshold, '| amount:', transaction.amount, '| fired:', fired);
      return fired;
    });

    await docClient.send(
      new PutCommand({
        TableName: TRANSACTIONS_TABLE,
        Item: transaction,
      })
    );

    await Promise.all(
      firedRules.map((rule) => {
        const alert: Alert = {
          ruleId: rule.ruleId,
          ruleName: rule.name,
          threshold: rule.threshold,
          transaction,
          message: rule.alertMessage,
          triggeredAt: new Date().toISOString(),
        };
        return sns.send(
          new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify(alert),
            Subject: `Spend alert: ${rule.name}`,
          })
        );
      })
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ evaluated: true, alertsFired: firedRules.length }),
    };
  } catch (err) {
    console.error('Lambda execution failed', { error: err, transactionId: transaction.id });
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
