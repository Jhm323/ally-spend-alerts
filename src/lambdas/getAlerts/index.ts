import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../utils/dynamo';

const ALERTS_TABLE = process.env.ALERTS_TABLE!;
const GSI_NAME = 'UserIdTimestampIndex';

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required query parameter: userId' }) };
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: ALERTS_TABLE,
        IndexName: GSI_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items ?? []),
    };
  } catch (err) {
    console.error('Lambda execution failed', { error: err, userId });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
