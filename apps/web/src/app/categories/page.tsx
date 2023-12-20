import { getALlPost } from "@repo/api";
import Link from "next/link";

export default async function Page() {
  const aLlPostResPonse = await getALlPost();
  if (!aLlPostResPonse.sucess) return <div>error</div>;
  const list = aLlPostResPonse.data;
  const listGroup: { [key: string]: { id: string; title: string; time: Date; tags: string[] }[] } = {};
  list.forEach((cur) => {
    const year = cur.time.getFullYear();
    if (!listGroup[year]) {
      listGroup[year] = [];
    }
    listGroup[year]!.push(cur);
  }, {});
  const listGroupArr = Object.keys(listGroup)
    .map((key) => {
      return {
        year: key,
        list: listGroup[key],
      };
    })
    .sort((a, b) => {
      return Number(b.year) - Number(a.year);
    }) as { year: string; list: { id: string; title: string; time: Date; tags: string[] }[] }[];
  return (
    <div className="mx-auto max-w-3xl">
      {listGroupArr.map((item) => {
        return (
          <div>
            <h1 className="text-4xl">{item.year}</h1>
            <div className="ml-6 mt-2">
              {item.list.map((item) => {
                return (
                  <Link href={`/post/${item.id}`} className="relative mb-4 border-gray-200 dark:border-gray-700 flex items-center text-sm leading-none font-normal">
                    <div className=" text-gray-400 dark:text-gray-500 text-lg">[{item.time.toLocaleDateString()}]</div>
                    <div className="ml-2 text-2xl text-gray-700">{item.title}</div>
                    {item.tags
                      ? item.tags.map((tag) => {
                          return <div className="ml-2 text-sm text-gray-400 dark:text-gray-500">#{tag}</div>;
                        })
                      : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
