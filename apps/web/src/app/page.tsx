import { getPostTotallPage } from "@repo/api";
import { PostList } from "./home/post-list";

export default async function Page() {
  const data = await getPostTotallPage();

  return <PostList total={3} />;
}
