# ally-spend-alerts

Serverless spend-alert system that receives bank transaction webhooks, evaluates them against per-user spending rules stored in DynamoDB, and fires alerts through SNS and SQS when a rule threshold is exceeded. Includes a React frontend for submitting transactions and browsing alert history.

## Architecture

**Submit flow**

```
React (S3)
  └─ POST /webhook
       └─ API Gateway
            └─ evaluateTransaction λ
                 ├─ DynamoDB (SpendingRules) — query rules for userId + category
                 ├─ DynamoDB (Transactions)  — write transaction record
                 └─ SNS (SpendAlerts)        — publish alert per fired rule
                       └─ SQS (SpendAlertsQueue)
                             └─ processAlert λ
                                  └─ DynamoDB (Alerts) — write alert record
```

**Query flow**

```
React (S3)
  └─ GET /alerts?userId=...
       └─ API Gateway
            └─ getAlerts λ
                 └─ DynamoDB (Alerts, GSI: UserIdTimestampIndex) — return sorted results
```

## AWS services

| Service | Purpose |
|---|---|
| API Gateway | HTTP entry point for webhook ingestion and alert queries |
| Lambda | evaluateTransaction, processAlert, getAlerts |
| DynamoDB | SpendingRules, Transactions, and Alerts tables |
| SNS | Fanout topic that decouples rule evaluation from alert processing |
| SQS | Alert queue with DLQ; buffers messages between SNS and processAlert |
| S3 | Lambda deployment artifacts (managed by SAM); frontend static hosting |

## Project structure

```
ally-spend-alerts/
├── src/
│   ├── lambdas/
│   │   ├── evaluateTransaction/    # Validates webhook, queries rules, writes transaction, publishes to SNS
│   │   ├── processAlert/           # SQS consumer — unwraps SNS envelope, writes alert record to DynamoDB
│   │   └── getAlerts/              # Returns alert history for a userId via GSI query, newest first
│   ├── types/
│   │   └── index.ts                # Shared interfaces: Transaction, SpendingRule, Alert
│   └── utils/
│       └── dynamo.ts               # DynamoDB document client singleton
├── frontend/
│   └── src/
│       ├── App.tsx                 # View toggle nav
│       ├── SubmitTransaction.tsx   # Transaction submission form
│       ├── AlertHistory.tsx        # Alert history table with userId lookup
│       └── index.css               # Plain CSS, no UI library
├── template.yaml                   # SAM template — all AWS resources and IAM policies
└── package.json                    # Lambda build dependencies and scripts
```

## Local development

```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_URL to your deployed API Gateway base URL,
# e.g. https://abc123.execute-api.us-east-1.amazonaws.com/prod
npm install
npm run dev
```

The frontend expects two routes on that base URL: `POST /webhook` and `GET /alerts`.

## Deployment

```bash
npm install
sam build
sam deploy --guided
```

`sam deploy --guided` prompts for stack name, region, and S3 bucket on the first run and writes a `samconfig.toml` for subsequent deploys. After the first deploy, `sam deploy` (no flag) uses the saved config.

## Environment variables

All variables are injected by SAM at deploy time. Do not set them manually.

| Lambda | Variable | Source |
|---|---|---|
| evaluateTransaction | `TRANSACTIONS_TABLE` | DynamoDB Transactions table name |
| evaluateTransaction | `SPENDING_RULES_TABLE` | DynamoDB SpendingRules table name |
| evaluateTransaction | `SNS_TOPIC_ARN` | SNS SpendAlerts topic ARN |
| processAlert | `ALERTS_TABLE` | DynamoDB Alerts table name |
| getAlerts | `ALERTS_TABLE` | DynamoDB Alerts table name |

