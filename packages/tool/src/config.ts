import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** absolute note path  */
export const NOTE_PATH = path.join(__dirname, "../../../note");
/** absolute picture path  */
export const PICTURE_PATH = path.join(__dirname, "../../../public");
/** absolute repo path  */
export const REPO_PATH = path.join(__dirname, "../../../");

export const LinkConfig = {
  owner: "yjrhgvbn",
  repo: "blog-rsc",
  branch: "main",
};

export const LinkRules = {
  githubTree: "https://github.com/{{owner}}/blog-rsc/tree/{{branch}}/{{path}}",
  githubPage: "https://{{owner}}.github.io/{{repo}}/{{path}}",
  GitHub: "https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}",
  jsDelivr: "https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}",
  Statically: "https://cdn.statically.io/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}",
  ChinaJsDelivr: "https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}",
};
