import { getALlPost, getPostDetail } from "@repo/api";
import { Typography } from "../typography";

export default async function Page({ params }: { params: { postId: string } }) {
  const postRespone = await getPostDetail(params.postId);
  if (!postRespone.sucess) return <div>error</div>;
  const post = postRespone.data;
  return (
    <div>
      <Typography source={post?.content || ""} />
    </div>
  );
}

export async function generateStaticParams() {
  const allPostRespone = await getALlPost();
  if (!allPostRespone.sucess) return [];
  const list = allPostRespone.data;
  return list.map((item) => {
    return {
      postId: item.id,
    };
  });
}
