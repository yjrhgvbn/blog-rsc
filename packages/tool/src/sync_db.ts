// save all notes to db
import fs from "node:fs";
import { prisma } from "@repo/db";
import matter from "gray-matter";
import { getDiffFiles } from "./utils";

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
  await prisma.post.deleteMany({ where: { path: { in: remove.map((i) => i.relateNotePath) } } });
  for (let i = 0; i < add.length; i++) {
    const { relateNotePath, absolutePath, hash } = add[i]!;
    const { tags, ...rest } = readAndParseFile(absolutePath);
    await prisma.post.create({
      data: {
        path: relateNotePath,
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
  // sqlite has limit number of batch updates
  for (let i = 0; i < update.length; i++) {
    const { relateNotePath, absolutePath, hash } = update[i]!;
    const { tags, ...rest } = readAndParseFile(absolutePath);
    await prisma.post.update({
      where: { path: relateNotePath },
      data: {
        path: relateNotePath,
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
}

async function run() {
  await prisma.$connect();
  await saveDiffFiles();
  await prisma.$disconnect();
}
run();
