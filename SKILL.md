# SKILL: Dorpwag™ Agent
## App
Dorpwag™ — SA Community Platform

## Jira Reference
KAN-9

## Stack
- Mobile: React Native
- Backend: Node.js + Express
- Database: PostgreSQL
- Payments: Payfast (ZAR)
- Auth: JWT

## Branch Convention
- Always branch from: `develop`
- Branch format: `feature/KAN-9-short-description`
- Never push directly to: `main`

## Agent Rules
1. Read Jira ticket before starting any work
2. Branch from develop using correct naming convention
3. Write tests for all new code (Jest for unit, Detox for e2e)
4. Raise PR to develop when complete
5. Post PR link to #dev-updates in Slack
6. Mark Jira ticket as IN REVIEW after PR raised
7. Flag any IP-sensitive features to IP-5 before building
8. Flag any data model changes to DEV-4 before implementing
9. Never hardcode API keys or credentials — use .env
10. All PRs must pass linting and tests before requesting review
