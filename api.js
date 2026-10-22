// API design QA for population-scale public infrastructure: reviews pasted
// endpoint lines for privacy leaks in URLs, missing versioning, verb-in-path
// RPC drift, unpaginated lists, missing idempotency hints and naming drift.
// Heuristic review of pasted lines. Pure functions, no DOM.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ApiDesignCheck = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function parseLines(input) {
    const eps = [];
    const skipped = [];
    input.split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const p = raw.split('|').map((s) => s.trim());
      if (p.length >= 2 && /^(GET|POST|PUT|PATCH|DELETE)$/i.test(p[0]))
        eps.push({ method: p[0].toUpperCase(), path: p[1], note: p.slice(2).join(' | '), line: i + 1 });
      else skipped.push(i + 1);
    });
    return { eps, skipped };
  }

  function check(input) {
    const { eps, skipped } = typeof input === 'string' ? parseLines(input) : input;
    const findings = [];
    const push = (level, code, text) => findings.push({ level, code, text });

    eps.forEach((e) => {
      if (/\d{12}|email|phone|aadhaar|ssn/i.test(e.path))
        push('error', 'PII_IN_PATH', `Line ${e.line}: ${e.method} ${e.path} appears to carry an identifier/PII in the URL - URLs get logged and cached; verify this moves to a body field or opaque id.`);
      if (!/^\/v\d+\//.test(e.path))
        push('warn', 'MISSING_VERSION_PREFIX', `Line ${e.line}: ${e.path} has no /vN prefix - verify versioning exists somewhere; unversioned public APIs break consumers on change.`);
      if (/\/(get|create|update|delete|fetch|remove)[A-Za-z_]*/i.test(e.path))
        push('warn', 'VERB_IN_PATH', `Line ${e.line}: ${e.path} reads like RPC ("${(e.path.match(/\/(get|create|update|delete|fetch|remove)[A-Za-z_]*/i) || ['',''])[1]}") - verify whether a resource + ${e.method} expresses it better; verb endpoints drift from interoperability conventions.`);
      if (e.method === 'GET' && /\/[a-z-]+s\/?$/i.test(e.path) && !/limit|offset|cursor|page/i.test(e.note + ' ' + e.path))
        push('warn', 'LIST_NO_PAGINATION', `Line ${e.line}: GET ${e.path} looks like a collection with no pagination hint - verify limit/offset or cursor exists before population-scale data lands.`);
      if (e.method === 'POST' && !/idempoten/i.test(e.note))
        push('warn', 'POST_NO_IDEMPOTENCY_HINT', `Line ${e.line}: POST ${e.path} has no idempotency hint - verify retries cannot double-create records; unreliable networks retry.`);
    });

    const styles = new Set(eps.map((e) => /[a-z]+_[a-z]+/.test(e.path) ? 'snake' : (/[a-z][A-Z]/.test(e.path) ? 'camel' : 'plain')));
    if (styles.has('snake') && styles.has('camel'))
      push('warn', 'NAMING_DRIFT', 'Paths mix snake_case and camelCase - verify one convention; naming drift erodes interoperability across teams.');
    if (skipped.length) push('warn', 'UNPARSED', `Line(s) ${skipped.join(', ')} skipped - expected METHOD | /path | note(optional).`);
    if (eps.length && !findings.some((f) => f.level !== 'ok'))
      push('ok', 'DESIGN_CLEAN', `${eps.length} endpoint(s) passed these heuristics - pattern-level screen only; see Limitations.`);
    return { findings, stats: { endpoints: eps.length } };
  }
  return { parseLines, check };
});
