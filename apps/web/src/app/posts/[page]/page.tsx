import { getPostCount, getPostDetail, getPostList } from "@repo/api";
import { PostList } from "../post-list";

export default async function Page({ params }: { params: { page: string } }) {
  const page = Number(params.page);
  const dataRespone = await getPostList({ page, pageSize: 10 });
  if (!dataRespone.sucess) return <div>error</div>;
  return (
    <div>
      <PostList page={page} />
    </div>
  );
}

export async function generateStaticParams() {
  const allPostRespone = await getPostCount();
  if (!allPostRespone.sucess) return [];
  const count = allPostRespone.data;
  if (count < 10) return [];

  return new Array(Math.ceil(count / 10)).fill(0).map((_, index) => {
    return {
      page: (index + 1).toString(),
    };
  });
}
