import { getPostList } from "@repo/api";
import { Pagination } from "./pagination";
import { PostCard } from "./post-card";

export async function PostList(props: { page: number }) {
  const dataRespone = await getPostList({ page: props.page, pageSize: 10 });
  if (!dataRespone.sucess) return <div>error</div>;
  const { total = 0, content: postList } = dataRespone.data;
  return (
    <div className="mx-auto max-w-3xl pb-10 ">
      {postList.map((post) => {
        return (
          <PostCard
            title={post.title}
            href={`/post/${post.id}`}
            time={post.createdAt.toLocaleDateString()}
            content={post.overview || ""}
            img={post.img || ""}
          />
        );
      })}
      <Pagination total={Math.ceil(total / 10)} currentPage={props.page} />
    </div>
  );
}
