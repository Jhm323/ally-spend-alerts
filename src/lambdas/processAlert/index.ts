import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { Alert } from '../../types';
import { docClient } from '../../utils/dynamo';

const ALERTS_TABLE = process.env.ALERTS_TABLE!;

interface SnsEnvelope {
  Message: string;
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      const envelope = JSON.parse(record.body) as SnsEnvelope;
      const alert = JSON.parse(envelope.Message) as Alert;

      const alertRecord = {
        alertId: uuidv4(),
        userId: alert.transaction.userId,
        transactionId: alert.transaction.id,
        ruleId: alert.ruleId,
        amount: alert.transaction.amount,
        threshold: alert.threshold,
        category: alert.transaction.merchantCategory,
        timestamp: alert.triggeredAt,
      };

      await docClient.send(
        new PutCommand({
          TableName: ALERTS_TABLE,
          Item: alertRecord,
        })
      );

      console.log(JSON.stringify({
        level: 'INFO',
        alertId: alertRecord.alertId,
        userId: alertRecord.userId,
        transactionId: alertRecord.transactionId,
        ruleId: alertRecord.ruleId,
        amount: alertRecord.amount,
        threshold: alertRecord.threshold,
        category: alertRecord.category,
        timestamp: alertRecord.timestamp,
      }));
    } catch (err) {
      console.error(JSON.stringify({
        level: 'ERROR',
        messageId: record.messageId,
        error: String(err),
      }));
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
