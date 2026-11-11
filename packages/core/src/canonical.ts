/** Thrown when a value cannot be represented as canonical JSON. A programmer error. */
export class CanonicalJsonError extends TypeError {
  override name = 'CanonicalJsonError';
}

const fail = (path: string, what: string): never => {
  throw new CanonicalJsonError(`canonicalJson: ${what} at ${path}`);
};

function write(value: unknown, path: string, ancestors: Set<object>): string {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) fail(path, 'non-finite number');
      return JSON.stringify(value);
    case 'undefined':
      return fail(path, 'undefined');
    case 'function':
      return fail(path, 'function');
    case 'symbol':
      return fail(path, 'symbol');
    case 'bigint':
      return fail(path, 'bigint');
    case 'object':
      break;
  }
  if (value === null) return 'null';
  const obj: object = value;
  if (ancestors.has(obj)) fail(path, 'cycle');
  ancestors.add(obj);
  let out: string;
  if (Array.isArray(obj)) {
    const parts: string[] = [];
    for (let i = 0; i < obj.length; i++) {
      if (!(i in obj)) fail(`${path}[${i}]`, 'array hole');
      parts.push(write((obj as unknown[])[i], `${path}[${i}]`, ancestors));
    }
    out = `[${parts.join(',')}]`;
  } else {
    const proto: unknown = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) fail(path, 'non-plain object');
    const record = obj as Record<string, unknown>;
    // Default sort compares UTF-16 code units, as RFC 8785 does.
    const keys = Object.keys(record).sort();
    out = `{${keys
      .map((k) => `${JSON.stringify(k)}:${write(record[k], `${path}.${k}`, ancestors)}`)
      .join(',')}}`;
  }
  ancestors.delete(obj);
  return out;
}

/**
 * Deterministic JSON: object keys sorted recursively (by UTF-16 code unit), no
 * whitespace, numbers and strings formatted as `JSON.stringify` does.
 *
 * Accepts only JSON values: `null`, booleans, finite numbers, strings, arrays and
 * plain objects. Throws `CanonicalJsonError` for `undefined` (anywhere, including
 * object values and array holes), functions, symbols, bigints, non-finite
 * numbers, cycles and non-plain objects such as `Date` or `Map`. Symbol keys are ignored.
 */
export function canonicalJson(value: unknown): string {
  return write(value, '$', new Set());
}

/**
 * SHA-256 of `tool + '\n' + canonicalJson(args)` as lowercase hex, using WebCrypto
 * (`globalThis.crypto.subtle`), available on Node 22 and Cloudflare Workers.
 */
export async function hashArgs(tool: string, args: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(`${tool}\n${canonicalJson(args)}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  let hex = '';
  for (const b of new Uint8Array(digest)) hex += b.toString(16).padStart(2, '0');
  return hex;
}
