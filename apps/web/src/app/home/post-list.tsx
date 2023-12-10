import { getPostList } from "@repo/api";
import { Pagination } from "./pagination";
import { PostCard } from "./post-card";

interface PostListProps {
  total: number;
}
export async function PostList(props: PostListProps) {
  const dataRespone = await getPostList({ page: 1, pageSize: 10 });
  if (!dataRespone.sucess) return <div>error</div>;
  const { total, content: postList } = dataRespone.data;
  return (
    <div className="mx-auto max-w-3xl ">
      {postList.map((post) => {
        return <PostCard title={post.title} href={`/post/${post.id}`} time={post.createdAt.toLocaleDateString()} content={post.content || ""} img={post.img || ""} />;
      })}
      <Pagination total={total} />
    </div>
  );
}
