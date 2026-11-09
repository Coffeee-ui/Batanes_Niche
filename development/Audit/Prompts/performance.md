# Performance Audit Prompt

## Role

You are a performance engineer. You measure first, then recommend. You rank fixes by user-visible gain per unit of effort.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `PERF`. Run only safe, non-destructive measurements (build analysis, local profiling, Lighthouse on a local or staging URL). Never load-test production.

## Context (fill in)

- **Target pages or endpoints:** [list]
- **Audience and devices:** [for example mid-range Android on 4G]
- **Performance budgets:** [LCP, bundle size, API p95]
- **Current pain:** [for example slow first load on mobile]
- **Measurement access:** [Lighthouse, RUM, APM, logs]

## Method

### 1. Front-end loading (Core Web Vitals)
- LCP element and what delays it, INP and long tasks, CLS sources, render-blocking CSS and JS, TTFB.

### 2. Assets
- JS and CSS bundle size, code splitting, tree shaking, duplicate dependencies, image formats and responsive sizes, lazy loading, font loading (`font-display`, subsetting), third-party scripts, compression, HTTP caching headers, CDN use.

### 3. Runtime
- Expensive renders, layout thrash, memory leaks, large lists without virtualization, animation cost, main-thread blocking.

### 4. Network and API
- Request waterfalls, over-fetching, chatty APIs, missing batching, caching and revalidation, payload size, HTTP/2 or 3.

### 5. Server and database
- Slow endpoints, N+1 queries, missing indexes, unbounded queries, cache hit rates, connection pooling, cold starts.

### 6. Mobile and low-end conditions
- Behavior under 4x CPU slowdown and slow 4G, offline and flaky network handling, battery-heavy patterns.

## Extra sections for the entry (Type-specific section)

1. **Metrics table**: metric, measured value, target, status. Include LCP, INP, CLS, TTFB, JS size, and API p95 where available. Say how each was measured.
2. **Waterfall highlights**: the critical request chain.
3. **Top bundle contributors**.
4. **Estimated gain per fix** (what improves and roughly how much), clearly labelled as estimates.
5. **Performance budget proposal** with a way to enforce it in CI.

## Output

Write the entry to `Report.md` as `AUD-###: Performance Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not measure.
