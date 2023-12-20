import type { Root, RootContent, Code } from "mdast";
import { merge } from "lodash-es";

export function remarkMarkCode() {
  return (tree: Root) => {
    const rootChildren = tree.children;
    const codes: [Code, number][] = [];
    rootChildren.forEach((node, index) => {
      if (isMarkedCodeBlock(node)) {
        codes.push([node, index]);
      }
      isMarkedCodeBlock(node);
    });

    let currentMarkedCodeHead: Code | null = null;
    codes.forEach(([node, rootIndex], index) => {
      if (index > 0) {
        const preCodeRootIndex = codes[index - 1]?.[1];
        if (preCodeRootIndex !== rootIndex - 1) {
          currentMarkedCodeHead = node;
        }
      }
      if (!currentMarkedCodeHead) currentMarkedCodeHead = node;
      const [fileName = "index.js", template = "static"] = node.meta?.split(" ") ?? [];
      currentMarkedCodeHead &&
        addData(currentMarkedCodeHead, {
          files: {
            [fileName]: node.value,
          },
          isFirstFile: true,
          // @ts-ignore
          template: currentMarkedCodeHead.data?.template || template,
        });
      addData(node, {
        isFileMarked: true,
      });
    });
  };
}

function addData(code: Code, data: Record<string, unknown>) {
  if (!code.data) code.data = {};
  merge(code.data, data);
}

// 是否是带标记的代码块
function isMarkedCodeBlock(node: RootContent): node is Code {
  return !!(node.type === "code" && node.meta);
}
export default remarkMarkCode;
