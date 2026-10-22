# API Design Check

A client-side heuristic review of API endpoint designs, built with Infystrat's problem in mind: open digital public infrastructure serves population-scale consumers for years, so privacy, versioning and interoperability mistakes in the API surface are expensive.

Paste endpoints, one per line as `METHOD | /path | note(optional)`, and the tool flags:

- **PII_IN_PATH** - an identifier or PII-looking value in the URL
- **MISSING_VERSION_PREFIX** - no /vN prefix on the path
- **VERB_IN_PATH** - RPC-style verbs (get/create/update/delete) in the path
- **LIST_NO_PAGINATION** - a collection GET with no pagination hint
- **POST_NO_IDEMPOTENCY_HINT** - a POST with no idempotency hint
- **NAMING_DRIFT** - snake_case and camelCase mixed across paths
- **UNPARSED** - lines that do not match the expected format

Plain HTML, CSS and JavaScript. No build step, no external services.

## Run

Open `index.html` in a browser, paste endpoints, click "Run design check".

## Test

```
npm test
```

## Limitations

This is a pattern-level screen of pasted endpoint lines, not an architecture review:

- It inspects paths and notes as text; it cannot see headers, auth, schemas or gateway config. Every finding says "verify".
- A hint in a note is not proof the mechanism exists - pagination and idempotency are checked as mentions, not behavior.
- Versioning may live in a header or host instead of the path; absence of /vN is a prompt to check, not a verdict.
- Tests verify the rules match their intended sample patterns; they do not prove real API surfaces are assessed correctly.
