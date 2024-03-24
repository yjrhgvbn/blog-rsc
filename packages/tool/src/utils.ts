import path, { isAbsolute, relative, resolve } from "node:path";
import fs from "node:fs";
import { hashFileSync } from "hasha";
import { prisma } from "@repo/db";
import fetch from "node-fetch";
import { LinkConfig, NOTE_PATH, REPO_PATH, LinkRules } from "./config";

export function toRelateNotePath(filePath: string) {
  if (!path.isAbsolute(filePath)) return filePath;
  return path.relative(NOTE_PATH, filePath);
}

export function toAbsoluteNotePath(filePath: string) {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(NOTE_PATH, filePath);
}

/**
 * get all file and hash, same content will have same hash
 * @returns {Record<string, string>} key is path, value is hash
 */
function getFileHash(dir: string) {
  const fileHashMap: Record<string, string> = {};
  loopDir(dir);
  return fileHashMap;

  function loopDir(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      const curFilePath = path.join(dir, file);
      if (fs.statSync(curFilePath).isDirectory()) {
        loopDir(curFilePath);
      } else {
        // only get .md file
        if (path.extname(file) !== ".md") return;
        if (file[0] === ".") return;
        const fileHash = hashFileSync(curFilePath, { algorithm: "md5" });
        fileHashMap[curFilePath] = fileHash;
      }
    });
  }
}

export function getAllNoteMdFiles() {
  const dir = NOTE_PATH;
  const files: { relateNodePath: string; absolutePath: string }[] = [];
  loopDir(dir);
  return files;

  function loopDir(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      const curFilePath = path.join(dir, file);
      if (fs.statSync(curFilePath).isDirectory()) {
        loopDir(curFilePath);
      } else {
        if (path.extname(file) !== ".md") return;
        if (file[0] === ".") return;
        files.push({ relateNodePath: toRelateNotePath(curFilePath), absolutePath: curFilePath });
      }
    });
  }
}

export interface fileHashRecord {
  relateNotePath: string;
  absolutePath: string;
  hash: string;
}

/**
 *  return diff files
 */
export async function getDiffFiles() {
  const absfileHashMap = await getFileHash(NOTE_PATH);
  const preFileHashList = await prisma.post.findMany({ select: { hash: true, path: true } });
  const removeFileHashList: fileHashRecord[] = [];
  const addFileHashList: fileHashRecord[] = [];
  const updateFileHashList: fileHashRecord[] = [];
  preFileHashList.forEach((item) => {
    const { hash, path } = item;
    const absolutePath = toAbsoluteNotePath(path);
    const relatePath = path;
    const mapHash = absfileHashMap[absolutePath];
    absfileHashMap[absolutePath] = "";
    if (!mapHash) {
      removeFileHashList.push({ absolutePath, relateNotePath: relatePath, hash });
      return;
    }
    if (hash !== mapHash) {
      updateFileHashList.push({ relateNotePath: relatePath, absolutePath, hash: mapHash });
    }
  });
  Object.entries(absfileHashMap).forEach(([path, hash]) => {
    if (hash) {
      addFileHashList.push({ relateNotePath: toRelateNotePath(path), absolutePath: path, hash });
    }
  });
  return {
    remove: removeFileHashList,
    add: addFileHashList,
    update: updateFileHashList,
  };
}

/** check url is cur repo path */
export function isCurRepoPath(link: string) {
  return Object.values(LinkRules).some((rule) => isMathRule(link, rule, LinkConfig));
}

/** check url */
function isMathRule(link: string, rule: string, config: Record<string, string>) {
  const groups = getRuleMatchGroups(link, rule);
  if (!groups) return false;
  return Object.keys(groups).every((key) => {
    const value = groups[key];
    if (key in config && value !== config[key]) return false;
    return true;
  });
}
/** pares url by provide rule */
function getRuleMatchGroups(link: string, rule: string) {
  const regStr = rule.replaceAll(/{{(?<key>.+?)}}/g, (_, key) => {
    if (key === "path") return "(?<path>.+)"; // path can be any string
    return `(?<${key}>[^/]+)`;
  });
  const reg = new RegExp(regStr);
  const matchRes = link.match(reg);
  if (!matchRes || !matchRes.groups) return null;
  return matchRes.groups;
}

/** get cur repo link url */
export function getLinkPath(path: string, ruleKey: keyof typeof LinkRules = "ChinaJsDelivr") {
  const rule = LinkRules[ruleKey];
  return rule.replaceAll(/{{(?<key>.+?)}}/g, (_, key) => {
    if (key === "path") {
      if (isAbsolute(path)) {
        return relative(REPO_PATH, path);
      }
      return path;
    }
    if (key in LinkConfig) {
      return LinkConfig[key as keyof typeof LinkConfig];
    }
    return "";
  });
}

/** Download the image to the given path */
export async function downloadPic(url: string, imgPath: string) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(imgPath);
  await new Promise((resolve, reject) => {
    if (!res.body) return reject(new Error("no body"));
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

export function mdPathToAbsolute(linkPath: string, referPath: string) {
  if (linkPath.startsWith("/")) return path.join(REPO_PATH, linkPath);
  return resolve(referPath, "..", linkPath);
}
