import { getALlPost } from "@repo/api";
import Link from "next/link";
import "./index.css";
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
    <div className="mx-auto max-w-3xl ">
      {listGroupArr.map((item) => {
        return (
          <div className="mx-2 relative mt-28">
            <h1 className="year-title absolute -top-16 font-extrabold text-8xl">{item.year}</h1>
            <div className="ml-2 md:ml-6 mt-2">
              {item.list.map((item) => {
                return (
                  <Link
                    href={`/post/${item.id}`}
                    className="relative mb-4 border-gray-200 dark:border-gray-700 flex items-center text-sm leading-none font-normal"
                  >
                    <div className="hidden sm:block text-gray-400 dark:text-gray-500 text-lg mr-2">[{item.time.toLocaleDateString()}]</div>
                    <div className="text-2xl text-gray-600">{item.title}</div>
                    <div className="hidden sm:block">
                      {item.tags
                        ? item.tags.map((tag) => {
                            return <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">#{tag}</span>;
                          })
                        : null}
                    </div>
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
