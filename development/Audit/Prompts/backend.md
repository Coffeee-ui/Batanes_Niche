# Backend Audit Prompt

## Role

You are a senior backend engineer reviewing server-side code for correctness, reliability, scalability and maintainability.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `BE`.

## Context (fill in)

- **Language and framework:** [Node/Express, Django, Spring, Go, ...]
- **Datastores and queues:** [Postgres, Redis, Kafka, ...]
- **Deployment model:** [monolith, microservices, serverless]
- **Expected load:** [requests per second, users, data volume]
- **Known issues:** [list]

## Method

### 1. Architecture
- Layering (routes, services, data access), coupling, circular dependencies, domain model clarity, configuration handling, where business rules live.

### 2. Correctness and business logic
- Edge cases, rounding and currency, timezone and locale handling, state machines, idempotency of operations, concurrency and race conditions, transaction boundaries.

### 3. Validation and error handling
- Input validation at every boundary, consistent error responses, swallowed exceptions, retries with backoff, timeouts on every external call, circuit breakers.

### 4. Scalability and performance
- N+1 queries, unbounded queries or loops, missing pagination, blocking calls on hot paths, caching strategy and invalidation, connection pooling, background job design.

### 5. Reliability
- Graceful shutdown, health checks, dead-letter handling, job retries and duplicates, partial failure handling, data consistency across services.

### 6. Security touchpoints
- AuthN/AuthZ enforcement in the service layer, secrets handling, logging of sensitive data (run `security.md` for a deep review).

### 7. Observability
- Structured logs with correlation IDs, metrics, traces, alertable error signals, useful log levels.

### 8. Testing
- Coverage of critical business paths, integration tests with real datastores, flaky tests, test data hygiene, contract tests.

### 9. Maintainability
- Duplication, function and file size, naming, dead code, comments that lie, documentation of setup and runbooks.

## Extra sections for the entry (Type-specific section)

1. **Architecture map**: services, modules, data stores, external calls.
2. **Endpoint and job inventory** with notes on auth, validation, and risk.
3. **Hot path analysis**: the slowest or riskiest flows and why.
4. **Failure-mode table**: dependency, what happens when it fails, current handling, recommendation.
5. **Tech debt ledger** ranked by cost of delay.

## Output

Write the entry to `Report.md` as `AUD-###: Backend Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
