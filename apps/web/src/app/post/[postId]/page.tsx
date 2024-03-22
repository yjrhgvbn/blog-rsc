import { getALlPost, getPostDetail } from "@repo/api";
import { Typography } from "../typography";

export default async function Page({ params }: { params: { postId: string } }) {
  const postRespone = await getPostDetail(params.postId);
  if (!postRespone.sucess) return <div>error</div>;
  const post = postRespone.data;
  const { title = post?.title, content } = pickfirstHead(post?.content || "");
  return (
    <div className="py-8 px-4">
      <div className="text-3xl md:text-4xl flex justify-center font-bold mb-8">
        <span className="max-w-3xl">{title}</span>
      </div>
      <Typography source={content} />
    </div>
  );
}

function pickfirstHead(content: string) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.trim().startsWith("#")) {
      return {
        title: lines[i]!.trim().replace("#", "").trim(),
        content: lines.slice(i + 1).join("\n"),
      };
    }
  }
  return {
    title: "",
    content,
  };
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
