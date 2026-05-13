# ally-spend-alerts

Transaction webhook receiver that evaluates spend against DynamoDB rules and fires alerts via SNS → SQS → Lambda.

## Architecture

```
Ally webhook → API Gateway → evaluateTransaction λ → DynamoDB (rules lookup) → SNS
                                                                                  ↓
                                                             processAlert λ ← SQS
```

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20+

## Development

```bash
npm install
npm run typecheck
```

## Deploy

```bash
npm run build    # sam build
npm run deploy   # sam deploy --guided (first time); omit --guided after
```
