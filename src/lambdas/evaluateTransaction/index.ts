import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'ok' }),
  };
};
