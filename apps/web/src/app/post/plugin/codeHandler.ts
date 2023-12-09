import type { State } from 'mdast-util-to-hast';
import type { Element, Properties } from 'hast';
import type { Code } from 'mdast';

export function codeHandler(state: State, node: Code) {
  const value = node.value ? `${node.value}\n` : '';
  // To do: next major, use `node.lang` w/o regex, the splitting’s been going
  // on for years in remark now.
  const lang = node.lang ? node.lang.match(/^[^\t ]+(?=[\t ]|$)/) : null;
  /** @type {Properties} */
  const properties: Properties = {};

  if (lang) {
    properties.className = [`language-${lang.toString()}`];
  }

  // Create `<code>`.
  /** @type {Element} */
  let result: Element = {
    type: 'element',
    tagName: 'code',
    properties,
    children: [{ type: 'text', value }],
    data: node.data,
  };

  if (node.meta) {
    result.data = { meta: node.meta, ...node.data };
  }

  state.patch(node, result);
  result = state.applyData(node, result);

  // Create `<pre>`.
  result = { type: 'element', tagName: 'pre', properties: {}, children: [result] };
  state.patch(node, result);
  return result;
}

export default codeHandler;
