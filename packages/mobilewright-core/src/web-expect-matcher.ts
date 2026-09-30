// Builds the calling convention for Playwright's injected expect() matcher.
// Verified against playwright-core@1.63.0: injected.expect(element, params,
// elements) returns { matches, received }; pass = matches !== isNot. The injected
// matcher requires an element, so a selector that matches nothing is decided
// here (missingElementVerdict), as playwright-core does in Frame._expectInternal.

export interface ExpectedTextValue {
  string?: string;
  regexSource?: string;
  regexFlags?: string;
  matchSubstring?: boolean;
  ignoreCase?: boolean;
  normalizeWhiteSpace?: boolean;
}

export interface FrameExpectParams {
  expression: string;
  expressionArg?: unknown;
  expectedText?: ExpectedTextValue[];
  expectedNumber?: number;
  expectedValue?: unknown;
  isNot: boolean;
  timeout: number;
}

export interface ExpectResult {
  matches: boolean;
  received?: unknown;
  missingReceived?: boolean;
}

// Build an ExpectedTextValue from a string or RegExp, plus optional match flags.
export function textValue(
  value: string | RegExp,
  flags: { normalizeWhiteSpace?: boolean; matchSubstring?: boolean; ignoreCase?: boolean } = {},
): ExpectedTextValue {
  if (value instanceof RegExp) {
    return { regexSource: value.source, regexFlags: value.flags, ...flags };
  }
  return { string: value, ...flags };
}

// Matchers that judge the whole element list, so an empty list is a valid input.
function isArrayExpression(expression: string): boolean {
  return expression === 'to.have.count' || expression.endsWith('.array');
}

// Matchers that hold for an element that does not exist.
const TRUE_WHEN_MISSING = new Set(['to.be.hidden', 'to.be.detached']);

// Negated matchers that pass outright on a missing element.
const NEGATION_PASSES_WHEN_MISSING = new Set(['to.be.visible', 'to.be.attached', 'to.be.in.viewport']);

// The verdict for a selector that matches no element. Mirrors the no-element
// branch of playwright-core's Frame._expectInternal.
export function missingElementVerdict(params: FrameExpectParams): ExpectResult {
  if (!params.isNot && TRUE_WHEN_MISSING.has(params.expression)) {
    return { matches: true };
  }
  if (params.isNot && NEGATION_PASSES_WHEN_MISSING.has(params.expression)) {
    return { matches: false };
  }
  return { matches: params.isNot, missingReceived: true };
}

// A single self-contained evaluate: resolve the selector, run the injected
// matcher, return its serializable verdict. No JSHandles needed. Resolves to
// null when a single-element matcher finds no element; the caller then uses
// missingElementVerdict.
export function buildExpectEvaluate(selector: string, params: FrameExpectParams): string {
  const sel = JSON.stringify(selector);
  const opts = JSON.stringify(params);
  const missingElementGuard = isArrayExpression(params.expression) ? '' : 'if (elements.length === 0) { return null; }';
  return `(async () => {
    const is = window.__mwInjected;
    const elements = is.querySelectorAll(is.parseSelector(${sel}), document);
    ${missingElementGuard}
    const r = await is.expect(elements[0], ${opts}, elements);
    return { matches: r.matches, received: r.received };
  })()`;
}
