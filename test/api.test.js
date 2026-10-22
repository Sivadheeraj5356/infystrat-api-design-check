const test = require('node:test');
const assert = require('node:assert/strict');
const { check } = require('../api.js');

test('identifier-looking value in path is an error', () => {
  const { findings } = check('GET | /v1/users/999999999999/records');
  const f = findings.find((x) => x.code === 'PII_IN_PATH');
  assert.ok(f && f.level === 'error');
});

test('missing version prefix is flagged', () => {
  const { findings } = check('GET | /users | limit=50');
  assert.ok(findings.some((f) => f.code === 'MISSING_VERSION_PREFIX'));
});

test('verb in path is flagged', () => {
  const { findings } = check('POST | /v1/createScheme | idempotent via key');
  assert.ok(findings.some((f) => f.code === 'VERB_IN_PATH'));
});

test('collection GET without pagination hint is flagged', () => {
  const { findings } = check('GET | /v1/applications');
  assert.ok(findings.some((f) => f.code === 'LIST_NO_PAGINATION'));
});

test('POST without idempotency hint is flagged', () => {
  const { findings } = check('POST | /v1/payments');
  assert.ok(findings.some((f) => f.code === 'POST_NO_IDEMPOTENCY_HINT'));
});

test('mixed naming conventions are flagged', () => {
  const { findings } = check('GET | /v1/benefit_payments | limit=50\nGET | /v1/citizenRecords | limit=50');
  assert.ok(findings.some((f) => f.code === 'NAMING_DRIFT'));
});

test('clean endpoints yield the clean note and malformed lines are unparsed', () => {
  const { findings } = check('GET | /v1/citizens | cursor paginated\nnonsense line');
  assert.ok(findings.some((f) => f.code === 'UNPARSED'));
  const clean = check('GET | /v1/citizens | cursor paginated');
  assert.ok(clean.findings.some((f) => f.code === 'DESIGN_CLEAN'));
});
