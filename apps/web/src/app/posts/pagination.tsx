import clsx from "clsx";
import Link from "next/link";

interface PaginationProps {
  total: number;
  currentPage?: number;
}

export function Pagination(props: PaginationProps) {
  const pathName = "/posts";
  const { total, currentPage = 0 } = props;
  if (!total || total <= 1) return null;
  return (
    <nav aria-label="page navigation" className="m-auto w-full flex justify-center">
      <ul className="list-style-none flex items-center">
        <li>
          <Link
            href={`${pathName}/${currentPage - 1}`}
            className={clsx(
              "relative block rounded bg-transparent px-3 py-1.5 text-2xl  text-neutral-600 transition-all duration-300  dark:text-white ",
              currentPage === 1 ? "pointer-events-none" : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
            )}
            aria-label="Previous &laquo;"
          >
            &laquo;
          </Link>
        </li>
        {new Array(total).fill(0).map((_, index) => {
          return (
            <li key={index}>
              <Link
                href={`${pathName}/${index + 1}`}
                className={clsx(
                  "relative block rounded bg-transparent px-3 py-1.5 text-xl  text-neutral-600 transition-all duration-300  dark:text-white ",
                  currentPage === index + 1
                    ? "pointer-events-none"
                    : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
                )}
                aria-label={`Page ${index + 1}`}
              >
                {index + 1}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={`${pathName}/${currentPage + 1}`}
            className={clsx(
              "relative block rounded bg-transparent px-3 py-1.5 text-2xl  text-neutral-600 transition-all duration-300  dark:text-white ",
              currentPage === total
                ? "pointer-events-none"
                : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
            )}
            aria-label="Next &raquo;"
          >
            &raquo;
          </Link>
        </li>
      </ul>
    </nav>
  );
}
