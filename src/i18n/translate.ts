import { Fragment, createElement, type ReactNode } from "react";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/**
 * A message that changes with a number. `other` is required; the rest follow Intl.PluralRules for the
 * language (English uses one/other, Hebrew adds two, Russian adds few/many). `{count}` inserts the number.
 */
export type PluralMessage = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/** The shape every other language has to match: the same keys as English, any plural forms. */
export type Translation<T> = T extends string
  ? string
  : T extends { other: string }
    ? PluralMessage
    : { [K in keyof T]: Translation<T[K]> };

export type Namespace = keyof Messages;

/** "title" | "empty.title" | ... for a namespace. */
export type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string | { other: string } ? K : `${K}.${MessageKey<T[K]>}`;
}[keyof T & string];

export type Values = Record<string, string | number>;
export type RichValues = Record<string, string | number | ReactNode | ((chunks: ReactNode) => ReactNode)>;

export type Translator<N extends Namespace> = {
  (key: MessageKey<Messages[N]>, values?: Values): string;
  /** For messages with markup: "<b>{name}</b> paid" with `{ b: (chunks) => <strong>{chunks}</strong> }`. */
  rich: (key: MessageKey<Messages[N]>, values?: RichValues) => ReactNode;
  /** Whether the key exists, for lookups by id (`t.has(\`kinds.${kind}\`)`). */
  has: (key: string) => boolean;
  /** A lookup by a key built at runtime (an enum value). Falls back to `fallback` when it's missing. */
  dynamic: (key: string, values?: Values, fallback?: string) => string;
  locale: Locale;
};

const pluralRules = new Map<Locale, Intl.PluralRules>();

function pluralOf(locale: Locale, count: number) {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALES[locale]);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

function lookup(messages: unknown, path: string): unknown {
  let node = messages;
  for (const part of path.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function pick(locale: Locale, message: unknown, values: Record<string, unknown> | undefined): string | undefined {
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "other" in message) {
    const plural = message as PluralMessage;
    const count = Number(values?.count ?? 0);
    if (count === 0 && plural.zero !== undefined) return plural.zero;
    return plural[pluralOf(locale, count)] ?? plural.other;
  }
  return undefined;
}

function interpolate(text: string, values: Values | undefined) {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/** Splits "a <b>bold {x}</b> c" into nodes, calling the tag functions and filling in values. */
function richNodes(text: string, values: RichValues, keyPrefix = ""): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /<(\w+)>([\s\S]*?)<\/\1>|\{(\w+)\}/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}${index++}`;
    if (match[1]) {
      const tag = values[match[1]];
      const children = richNodes(match[2], values, `${key}.`);
      nodes.push(
        typeof tag === "function"
          ? createElement(Fragment, { key }, (tag as (chunks: ReactNode) => ReactNode)(children))
          : createElement(Fragment, { key }, ...children),
      );
    } else {
      const value = values[match[3]];
      nodes.push(value === undefined ? match[0] : createElement(Fragment, { key }, value as ReactNode));
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function createTranslator<N extends Namespace>(
  locale: Locale,
  messages: Messages | Translation<Messages>,
  namespace: N,
): Translator<N> {
  const scope = (messages as Record<string, unknown>)[namespace];
  const resolve = (key: string, values?: Record<string, unknown>) => pick(locale, lookup(scope, key), values);

  const t = ((key: string, values?: Values) => {
    const text = resolve(key, values);
    return text === undefined ? `${namespace}.${key}` : interpolate(text, values);
  }) as unknown as Translator<N>;

  t.rich = (key: string, values: RichValues = {}) => {
    const text = resolve(key, values);
    if (text === undefined) return `${namespace}.${key}`;
    return createElement(Fragment, null, ...richNodes(text, values));
  };
  t.has = (key: string) => resolve(key, { count: 1 }) !== undefined;
  t.dynamic = (key: string, values?: Values, fallback?: string) => {
    const text = resolve(key, values);
    return text === undefined ? (fallback ?? key) : interpolate(text, values);
  };
  t.locale = locale;
  return t;
}
