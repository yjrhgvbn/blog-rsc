import { prisma, Prisma } from "@repo/db";
import { wrapResponse } from "./utils";

export const getPostDetail = wrapResponse(async (id: string) => {
  return prisma.post.findUnique({
    where: { id },
  });
});

export const getPostList = wrapResponse(async (params?: { page: number; pageSize: number; title?: string; tags?: string }) => {
  const { page = 1, pageSize = 1, title, tags } = params || {};
  const query: Prisma.PostFindManyArgs = {
    include: { tags: { select: { name: true } } },
    where: {
      published: true,
      title: { contains: title || "" },
      OR: [
        {
          tags: {
            none: {},
          },
        },
        {
          tags: {
            some: {
              name: {
                in: tags?.split(","),
              },
            },
          },
        },
      ],
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
  };
  const [posts, count] = await prisma.$transaction([prisma.post.findMany(query), prisma.post.count()]);
  return {
    content: posts,
    page: page,
    pageSize: pageSize,
    total: count,
  };
});

export const getPostTotallPage = wrapResponse(async () => {
  const count = await prisma.post.count();
  return Math.ceil(count / 10);
});

export const getALlPost = wrapResponse(async () => {
  const res = await prisma.post.findMany({
    include: { tags: { select: { name: true } } },
  });
  return res.map((item) => {
    return {
      id: item.id,
      tags: item.tags.map((tag) => tag.name),
      title: item.title,
      time: item.createdAt,
    };
  });
});

export const getPostCount = wrapResponse(async () => {
  return prisma.post.count();
});
