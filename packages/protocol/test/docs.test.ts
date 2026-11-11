import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  BriefCardSchema,
  CARD_DATA_SCHEMAS,
  CARD_TYPES,
  ProvenanceSchema,
  SourceSchema,
  TemplateManifestSchema,
  ToolDescriptorSchema,
} from '../src/index.js';

const doc = readFileSync(new URL('../../../docs/protocol.md', import.meta.url), 'utf8');

/** Field names (with `?` for optional) from the first column of the first table under `heading`. */
function documentedFields(heading: string): string[] {
  const lines = doc.split('\n');
  const start = lines.indexOf(heading);
  if (start === -1) throw new Error(`Missing heading: ${heading}`);
  const fields: string[] = [];
  let inTable = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('#')) break;
    // Only the first table under the heading.
    if (line.startsWith('|')) inTable = true;
    else if (inTable) break;
    const match = /^\|\s*`([^`]+)`\s*\|/.exec(line);
    if (match?.[1] !== undefined) fields.push(match[1]);
  }
  return fields;
}

function schemaFields(schema: z.ZodObject): string[] {
  return Object.entries(schema.shape).map(([key, field]) =>
    (field as z.ZodType).safeParse(undefined).success ? `${key}?` : key,
  );
}

describe('docs/protocol.md matches the schemas', () => {
  it.each(CARD_TYPES)('documents %s data', (type) => {
    expect(documentedFields(`### \`${type}\``).sort()).toEqual(
      schemaFields(CARD_DATA_SCHEMAS[type]).sort(),
    );
  });

  it.each([
    ['### Base card fields', BriefCardSchema],
    ['### Source', SourceSchema],
    ['### Provenance', ProvenanceSchema],
    ['### Template manifest fields', TemplateManifestSchema],
    ['## Tools', ToolDescriptorSchema],
  ] as const)('documents %s', (heading, schema) => {
    expect(documentedFields(heading).sort()).toEqual(schemaFields(schema).sort());
  });
});
