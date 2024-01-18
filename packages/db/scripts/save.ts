// save all notes to db
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { hashFileSync } from "hasha";
import { prisma } from "../src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notePath = path.join(__dirname, "../../../note");

function toRelatePath(filePath: string) {
  return path.relative(notePath, filePath);
}
function toAbsolutePath(filePath: string) {
  return path.join(notePath, filePath);
}

/**
 * get all file and hash, same content will have same hash
 */
async function getabsFilesWithHash(dir: string) {
  const hasFileMap: Record<string, string> = {};
  loopDir(dir);
  // filter hash file
  const fileHashMap = Object.entries(hasFileMap).reduce(
    (acc, [hash, filePath]) => {
      acc[filePath] = hash;
      return acc;
    },
    {} as Record<string, string>
  );
  return fileHashMap;

  function loopDir(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      const curFilePath = path.join(dir, file);
      if (fs.statSync(curFilePath).isDirectory()) {
        loopDir(curFilePath);
      } else {
        if (file[0] === ".") return;
        const fileHash = hashFileSync(curFilePath, { algorithm: "md5" });
        hasFileMap[fileHash] = curFilePath;
      }
    });
  }
}

/**
 * get head info
 * ---
 * key: value
 * ---
 */
function getHeadInfoMark(data: string) {
  const headInfoMark = data.match(/---\n([\s\S]*?)\n---/);
  const content = data.replace(/---\n([\s\S]*?)\n---/, "");
  const res = {
    headInfo: {} as Record<string, string>,
    content,
  };
  if (!headInfoMark?.[1]) return res;
  const headInfo = headInfoMark[1];
  const headInfoList = headInfo.split("\n");
  const headInfoMap: Record<string, string> = {};
  headInfoList.forEach((item) => {
    const [key, value] = item.split(":");
    if (!key || !value) return;
    headInfoMap[key.trim()] = value.trim();
  });
  return {
    headInfo: headInfoMap,
    content,
  };
}

type fileHashRecord = {
  path: string;
  hash: string;
};
/**
 *  return diff files
 */
async function getDiffFiles() {
  const absfileHashMap = await getabsFilesWithHash(notePath);
  const preFileHashList = await prisma.post.findMany({ select: { hash: true, path: true } });
  const removeFileHashList: fileHashRecord[] = [];
  const addFileHashList: fileHashRecord[] = [];
  const updateFileHashList: fileHashRecord[] = [];
  preFileHashList.forEach((item) => {
    const { hash, path } = item;
    const absPath = toAbsolutePath(path);
    const mapHash = absfileHashMap[absPath];
    absfileHashMap[absPath] = "";
    if (!mapHash) {
      removeFileHashList.push({ path, hash });
      return;
    }
    if (hash !== mapHash) {
      updateFileHashList.push({ path, hash });
    }
  });
  Object.entries(absfileHashMap).forEach(([path, hash]) => {
    if (hash) {
      addFileHashList.push({ path: toRelatePath(path), hash });
    }
  });
  return {
    remove: removeFileHashList,
    add: addFileHashList,
    update: updateFileHashList,
  };
}

function readAndParseFile(filePath: string) {
  const pathArr = filePath.trim().split("/").reverse();
  const [title, ...tags] = pathArr;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { headInfo, content } = getHeadInfoMark(fileContent);
  return {
    overview: headInfo.overview || headInfo.description,
    content: content,
    title: headInfo.title || title!.split(".").slice(0, -1).join("."), // remove .md
    tags: headInfo.tags ? headInfo.tags.split(",") : tags?.slice(-1),
    img: headInfo.img,
    imgDescription: headInfo.imgDescription,
  };
}

async function saveDiffFiles() {
  const { remove, add, update } = await getDiffFiles();
  await prisma.post.deleteMany({ where: { path: { in: remove.map((i) => i.path) } } });
  for (let i = 0; i < add.length; i++) {
    const { path, hash } = add[i]!;
    const { content, title, overview, tags, img, imgDescription } = readAndParseFile(toAbsolutePath(path));
    await prisma.post.create({
      data: {
        path,
        content,
        hash,
        overview,
        title,
        img,
        imgDescription,
        tags: {
          connectOrCreate: tags.map((tag) => {
            return {
              create: {
                name: tag,
              },
              where: {
                name: tag,
              },
            };
          }),
        },
      },
    });
  }
  await Promise.all(
    update.map(async ({ path, hash }) => {
      const { content, title, overview, tags, img, imgDescription } = readAndParseFile(toAbsolutePath(path));
      await prisma.post.update({
        where: { path },
        data: {
          content,
          hash,
          title,
          overview,
          img,
          imgDescription,
          tags: {
            connectOrCreate: tags.map((tag) => {
              return {
                create: {
                  name: tag,
                },
                where: {
                  name: tag,
                },
              };
            }),
          },
        },
      });
    })
  );
}

async function run() {
  await prisma.$connect();
  await saveDiffFiles();
  await prisma.$disconnect();
}
run();
