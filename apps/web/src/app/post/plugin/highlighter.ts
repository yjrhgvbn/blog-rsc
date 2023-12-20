import { common, createLowlight } from "lowlight";
import { toText } from "hast-util-to-text";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Element } from "hast";

interface Options {
  prefix?: string;
  detect?: boolean;
  subset?: string[];
  ignoreMissing?: boolean;
  plainText?: string[];
  aliases?: Record<string, string[] | string>;
}
const lowlight = createLowlight(common);

export const rehypeHighlight: Plugin = (options: Options = {}) => {
  const { aliases, prefix, plainText, ignoreMissing, subset, detect } = options;
  let name = "hljs";
  if (aliases) {
    lowlight.registerAlias(aliases);
  }

  // if (languages) {
  //   Object.getOwnPropertyNames(languages).forEach((key) => {
  //     lowlight.registerLanguage(key, languages[key]);
  //   });
  // }

  if (prefix) {
    const pos = prefix.indexOf("-");
    name = pos > -1 ? prefix.slice(0, pos) : prefix;
  }

  return (tree, file) => {
    visit(tree, "element", (node: Element, _, givenParent: Element) => {
      const parent = givenParent;

      if (node.tagName === "img") {
        node.properties = {
          ...node.properties,
          loading: "lazy",
        };
      }

      if (!parent || !("tagName" in parent) || parent.tagName !== "pre" || node.tagName !== "code" || !node.properties) {
        return;
      }

      const lang = language(node);

      if (!lang || (!lang && !detect) || (lang && plainText && plainText.includes(lang))) {
        return;
      }

      if (!Array.isArray(node.properties.className)) {
        node.properties.className = [];
      }

      if (!node.properties.className.includes(name)) {
        node.properties.className.unshift(name);
      }

      /** @type {LowlightRoot} */
      let result;
      const codeContent = toText(parent);
      try {
        result = lang ? lowlight.highlight(lang, codeContent, { prefix }) : lowlight.highlightAuto(codeContent, { prefix, subset });
      } catch (error) {
        const exception = error as Error;
        if (!ignoreMissing || !/Unknown language/.test(exception.message)) {
          file.fail(exception, node, "rehype-highlight:missing-language");
        }

        return;
      }

      if (!lang && result.data?.language) {
        const languageName: string = result.data.language;
        node.properties.className.push(`language-${languageName}`);
      }

      node.data = { ...node.data, language: result.data?.language, codeContent };

      if (Array.isArray(result.children) && result.children.length > 0) {
        node.children = result.children as any;
      }
    });
  };
};
export default rehypeHighlight;

function language(node: Element): string {
  const className = node.properties?.className;
  let index = -1;

  if (!Array.isArray(className)) {
    return "";
  }

  while (index + 1 < className.length) {
    index += 1;
    const value = String(className[index]);

    if (value === "no-highlight" || value === "nohighlight") {
      return "";
    }

    if (value.startsWith("lang-")) {
      return value.slice(5);
    }

    if (value.startsWith("language-")) {
      return value.slice(9);
    }
  }
  return "";
}
