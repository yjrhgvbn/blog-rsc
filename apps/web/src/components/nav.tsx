"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
// import { Button } from "@repo/ui";
import { GithubIcon, Twitter } from "@repo/ui/icons";
import { useState } from "react";

export function MainNav() {
  const pathname = usePathname();
  const [isShow, setIsShow] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <nav className="container flex h-14 items-center mx-auto max-w-3xl px-2">
        <div className="block sm:hidden">
          <button
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar"
            aria-expanded="false"
            onClick={() => {
              setIsShow(!isShow);
            }}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>
        {/* <div className="container flex h-14 items-center mx-auto max-w-3xl"> */}
        <div
          onClick={() => setIsShow(false)}
          className={clsx(
            "sm:w-auto sm:static sm:bg-inherit sm:flex-row sm:rounded-none sm:border-none sm:flex sm:items-center",
            "bg-gray-100 w-full absolute top-14 font-medium flex flex-col p-4 border border-gray-100 rounded-b-lg left-0",
            !isShow && "hidden"
          )}
        >
          <div className="fixed sm:hidden top-0 left-0 right-0 bottom-0"></div>
          <Link href="/" className="z-10 mr-12 block items-center font-black text-2xl">
            PalmPam
          </Link>
          <Link
            href="/categories"
            className={clsx(
              "z-10 sm:mr-6 mt-4 sm:mt-0 block transition-colors hover:text-slate-700",
              pathname?.startsWith("/categories") ? "text-slate-900 font-bold" : "text-[#3C3C3D]"
            )}
          >
            Categories
          </Link>
          <Link
            href="/about"
            className={clsx(
              "z-10 mt-4 sm:mt-0 block transition-colors hover:text-slate-700",
              pathname?.startsWith("/about") ? "text-slate-900" : "text-[#3C3C3D]"
            )}
          >
            About
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center">
            <Link
              href={"https://twitter.com/yongyuandebenp2"}
              target="_blank"
              rel="noreferrer"
              className="w-10"
              aria-label="Go to my twitter home page"
            >
              <Twitter size={"1.2rem"} className="m-auto" />
            </Link>
            <Link href={"https://github.com/yjrhgvbn"} target="_blank" rel="noreferrer" className="w-10" aria-label="Go to my github home page">
              <GithubIcon size={"1.2rem"} className="m-auto" />
            </Link>
            {/* <Button variant="ghost" size="icon" aria-label="switch to dark theme">
              <SunIcon size={"1.2rem"} />
            </Button> */}
          </nav>
        </div>
        {/* </div> */}
      </nav>
    </header>
  );
}
