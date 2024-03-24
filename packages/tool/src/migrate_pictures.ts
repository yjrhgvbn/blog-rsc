/**
 * migrate pictures to this repo
 * download all pictures to this repo and update the img path in the markdown files
 */
import path from "path";
import { getLinkPath, isCurRepoPath, downloadPic, getAllNoteMdFiles, mdPathToAbsolute } from "./utils";
import remarkFrontmatter from "remark-frontmatter";
import fs from "node:fs";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import parse from "remark-parse";
import type { Parent } from "hast";
import { nanoid } from "nanoid";
import { PICTURE_PATH } from "./config";

interface ImageNode extends Parent {
  url: string;
  type: "image";
  alt: string;
}

interface LinkNode extends Parent {
  url: string;
  type: "link";
  alt: string;
}

const tempDir = path.join(PICTURE_PATH, "temp");
function createTempPictureDir() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  return tempDir;
}

function removeTempPictureDir() {
  if (!fs.existsSync(tempDir)) return;
  fs.rmSync(tempDir, { recursive: true });
}

async function migrateMd(relateNodePath: string, absolutePath: string) {
  const testMd = fs.readFileSync(absolutePath, "utf-8");
  const res = await unified()
    .use(parse)
    .use(remarkReplaceImgPath, { relatePath: relateNodePath, absolutePath: absolutePath })
    .use(remarkReplaceLinkPath, { relatePath: relateNodePath, absolutePath: absolutePath })
    .use(remarkStringify)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .process(testMd);
  fs.writeFileSync(absolutePath, res.toString());
}

async function main() {
  removeTempPictureDir();
  createTempPictureDir();
  getAllNoteMdFiles()
    // .slice(0, 2)
    .forEach(({ relateNodePath, absolutePath }) => {
      migrateMd(relateNodePath, absolutePath);
    });
}

type Options = [
  {
    relatePath: string;
    absolutePath: string;
  },
];
const remarkReplaceImgPath: Plugin<Options> = function (options) {
  return async function (tree) {
    const needReplaceNodes: ImageNode[] = [];
    visit(tree, "image", function (node: ImageNode) {
      if (!isCurRepoPath(node.url)) {
        needReplaceNodes.push(node);
      }
    });
    await Promise.allSettled(
      needReplaceNodes.map(async (node, i) => {
        const { url, alt } = node;
        let tempAbsPath = url;
        const extname = path.extname(url);
        if (url.startsWith("http")) {
          tempAbsPath = path.join(tempDir, `img${i}${extname}`);
          await downloadPic(url, tempAbsPath).catch((e) => {
            console.log("download error", url, tempAbsPath);
            tempAbsPath = "";
            return false;
          });
        } else {
          tempAbsPath = path.join(options.absolutePath, "..", url);
        }
        if (!tempAbsPath) return;
        // TODO: compress image
        const targetPath = path.join(PICTURE_PATH, options.relatePath, "..");
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        const fileName = (alt ? alt.replaceAll(" ", "_").slice(0, 100) + "_" + nanoid(2) : nanoid()) + extname;
        fs.renameSync(tempAbsPath, path.join(targetPath, fileName));
        node.url = getLinkPath(path.join(targetPath, fileName));
        fs.rmSync(tempAbsPath, { recursive: true });
      })
    );
  };
};
const remarkReplaceLinkPath: Plugin<Options> = function (options) {
  return async function (tree) {
    visit(tree, "link", function (node: LinkNode) {
      const url = node.url;
      if (url.startsWith("http")) return;
      const absPath = mdPathToAbsolute(url, options.absolutePath);
      node.url = getLinkPath(absPath, "githubTree");
    });
  };
};
main();
