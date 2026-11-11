import { z } from 'zod';
import { BodyText } from './common.js';

export const RISK_TIERS = ['read', 'reversible-write', 'irreversible'] as const;
export const RiskTierSchema = z.enum(RISK_TIERS);
export type RiskTier = z.infer<typeof RiskTierSchema>;

/** A tool name: `connector.action`, lowercase, for example `mail.send`. */
export const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
export const ToolNameSchema = z.string().max(64).regex(TOOL_NAME_PATTERN, 'Invalid tool name');

/** A connector id: lowercase slug, for example `mail`. */
export const CONNECTOR_ID_PATTERN = /^[a-z][a-z0-9_-]{0,39}$/;
export const ConnectorIdSchema = z.string().regex(CONNECTOR_ID_PATTERN, 'Invalid connector id');

export const ToolDescriptorSchema = z.strictObject({
  name: ToolNameSchema,
  connector: ConnectorIdSchema,
  tier: RiskTierSchema,
  description: BodyText.min(1),
  argsSchemaId: z.string().min(1).max(128).optional(),
});
export type ToolDescriptor = z.infer<typeof ToolDescriptorSchema>;

/**
 * A tool registry. Validators accept an array of descriptors, a `Map` keyed by
 * name, or a plain record keyed by name.
 */
export type ToolRegistry =
  | readonly ToolDescriptor[]
  | ReadonlyMap<string, ToolDescriptor>
  | Readonly<Record<string, ToolDescriptor>>;

/** Looks a tool up by name in any registry shape. */
export function findTool(registry: ToolRegistry, name: string): ToolDescriptor | undefined {
  if (Array.isArray(registry)) {
    return (registry as readonly ToolDescriptor[]).find((t) => t.name === name);
  }
  if (registry instanceof Map) {
    return (registry as ReadonlyMap<string, ToolDescriptor>).get(name);
  }
  const record = registry as Readonly<Record<string, ToolDescriptor>>;
  return Object.hasOwn(record, name) ? record[name] : undefined;
}

const tool = (
  name: string,
  tier: RiskTier,
  description: string,
): Readonly<ToolDescriptor> =>
  Object.freeze({ name, connector: name.slice(0, name.indexOf('.')), tier, description });

/** The v1 built-in tool registry. The connector is the part of the name before the dot. */
export const BUILTIN_TOOLS: readonly Readonly<ToolDescriptor>[] = Object.freeze([
  tool('mail.search', 'read', 'Search messages in the connected mailbox.'),
  tool('mail.read', 'read', 'Read a message from the connected mailbox.'),
  tool('mail.create_draft', 'reversible-write', 'Create a draft in the connected mailbox.'),
  tool('mail.label', 'reversible-write', 'Add or remove a label on a message.'),
  tool('mail.archive', 'reversible-write', 'Archive a message.'),
  tool('mail.send', 'irreversible', 'Send an email.'),
  tool('mail.delete', 'irreversible', 'Delete a message.'),
  tool('calendar.read', 'read', 'Read events from the connected calendar.'),
  tool('web.search', 'read', 'Search the web.'),
  tool('web.fetch', 'read', 'Fetch a web page.'),
  tool('memory.read', 'read', "Read the Space's memory files."),
  tool('memory.write', 'reversible-write', "Write the Space's memory files."),
  tool('browser.open', 'read', 'Open a page in the browser.'),
  tool('browser.read', 'read', 'Read the current browser page.'),
  tool('browser.submit', 'irreversible', 'Submit a form in the browser.'),
]);
