"use client";
import clsx from "clsx";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
  total: number;
}

export function Pagination(props: PaginationProps) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const pathName = usePathname();
  const { total } = props;
  if (!total || total <= 1) return null;

  return (
    <nav aria-label="page navigation" className="m-auto w-full flex justify-center">
      <ul className="list-style-none flex">
        <li>
          <Link
            href={`${pathName}?page=${currentPage - 1}`}
            className={clsx(
              "relative block rounded bg-transparent px-3 py-1.5 text-sm text-neutral-600 transition-all duration-300  dark:text-white ",
              currentPage === 1 ? "pointer-events-none" : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
            )}
            aria-label="Previous"
          >
            <span aria-hidden="true">&laquo;</span>
          </Link>
        </li>
        {new Array(total).fill(0).map((_, index) => {
          return (
            <li key={index}>
              <Link
                href={`${pathName}?page=${index + 1}`}
                className={clsx(
                  "relative block rounded bg-transparent px-3 py-1.5 text-sm text-neutral-600 transition-all duration-300  dark:text-white ",
                  currentPage === index + 1 ? "pointer-events-none" : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
                )}
              >
                {index + 1}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={`${pathName}?page=${currentPage + 1}`}
            className={clsx(
              "relative block rounded bg-transparent px-3 py-1.5 text-sm text-neutral-600 transition-all duration-300  dark:text-white ",
              currentPage === total ? "pointer-events-none" : "pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-white"
            )}
            aria-label="Next"
          >
            <span aria-hidden="true">&raquo;</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
