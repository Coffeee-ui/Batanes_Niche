# API Audit Prompt


## Role

You are an API architect reviewing an HTTP API (REST, GraphQL, or RPC) for consistency, safety, usability and evolvability.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `API`. Do not call production endpoints with write operations.

## Context (fill in)

- **API style:** [REST / GraphQL / gRPC]
- **Spec available:** [OpenAPI file, schema, none]
- **Consumers:** [web app, mobile app, partners, public]
- **Auth scheme:** [bearer, API key, OAuth]
- **Known issues:** [list]

## Method

### 1. Design consistency
- Resource naming, HTTP verb and status code correctness, URL structure, casing, response envelope, field naming and types, date and ID formats.

### 2. Contracts
- Accuracy of the spec versus the code, request and response schemas, required versus optional fields, nullability, enum handling, backward compatibility.

### 3. Errors
- Consistent error shape, helpful messages without leaking internals, correct status codes, validation error detail, machine-readable codes.

### 4. Collections and efficiency
- Pagination (cursor versus offset), filtering, sorting, field selection, bulk operations, over-fetching and chatty patterns, N+1 in GraphQL resolvers, query depth and cost limits.

### 5. Safety
- AuthN/AuthZ per endpoint, rate limits and quotas, idempotency keys on unsafe operations, input size limits, CORS, webhook signing, sensitive data in responses.

### 6. Versioning and lifecycle
- Versioning strategy, deprecation policy, changelog, breaking-change risks.

### 7. Documentation and developer experience
- Examples, auth instructions, sandbox availability, SDK quality, time to first successful call.

## Extra sections for the entry (Type-specific section)

1. **Endpoint inventory**: method, path, auth, notes, issues.
2. **Spec drift list**: places where docs and code disagree.
3. **Consistency matrix**: naming, errors, pagination, dates across endpoints.
4. **Breaking-change risks** for current consumers.
5. **Proposed standards** (a short API style guide for the team).

## Output

Write the entry to `Report.md` as `AUD-###: API Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
