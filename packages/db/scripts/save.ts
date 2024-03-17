// save all notes to db
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { hashFileSync } from "hasha";
import { prisma } from "../src";
import matter from "gray-matter";

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

interface HeadInfoData {
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  draft?: boolean;
  img?: string;
  imgDescription?: string;
}
/**
 * get head info
 */
function getHeadInfoMark(data: string) {
  const res = matter(data) as {
    content: string;
    data: HeadInfoData;
  };
  // remove content blank line
  res.content = res.content.trim();
  return res;
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
      updateFileHashList.push({ path, hash: mapHash });
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
  const pathArr = filePath.trim().split("/").filter(Boolean).reverse();
  const [pathTitle, ...pathTag] = pathArr;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: headInfo, content } = getHeadInfoMark(fileContent);
  const title = pathTitle!.split(".").slice(0, -1).join("."); // remove .md
  const headTags = headInfo.tags;
  const res = {
    published: !headInfo.draft,
    overview: headInfo.description || "",
    content: content,
    title,
    tags: headTags || pathTag?.slice(0, 1),
    img: headInfo.img,
    imgDescription: headInfo.imgDescription || title,
    createdAt: headInfo.createdAt ? new Date(headInfo.createdAt) : headInfo.createdAt,
    updatedAt: headInfo.createdAt,
  };
  // console.table({ ...res, content: res.content.slice(0, 20) });
  return res;
}

async function saveDiffFiles() {
  const { remove, add, update } = await getDiffFiles();
  await prisma.post.deleteMany({ where: { path: { in: remove.map((i) => i.path) } } });
  for (let i = 0; i < add.length; i++) {
    const { path, hash } = add[i]!;
    const { tags, ...rest } = readAndParseFile(toAbsolutePath(path));
    await prisma.post.create({
      data: {
        path,
        hash,
        ...rest,
        tags: {
          connectOrCreate: tags.map((tag: any) => {
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
    update.slice(0, 1).map(async ({ path, hash }) => {
      const { tags, ...rest } = readAndParseFile(toAbsolutePath(path));
      await prisma.post.update({
        where: { path },
        data: {
          path,
          hash,
          ...rest,
          tags: {
            connectOrCreate: tags.map((tag: any) => {
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
