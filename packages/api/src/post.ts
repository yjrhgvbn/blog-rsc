import { prisma, Prisma } from "@repo/db";

export async function getPostDetail(id: string) {
  return prisma.post.findUnique({
    where: { id },
  });
}

export async function getPostList(params?: { page: number; pageSize: number; title?: string; tags?: string }) {
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
  };
  const [posts, count] = await prisma.$transaction([prisma.post.findMany(), prisma.post.count({ where: query.where })]);
  return {
    content: posts,
    page: page,
    pageSize: pageSize,
    total: count,
  };
  return;
}
