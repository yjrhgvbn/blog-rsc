"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Button } from "@repo/ui";
import { GithubIcon, Twitter, SunIcon } from "@repo/ui/icons";

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-14 items-center mx-auto max-w-3xl">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-12 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">PalmPam</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/categories" className={clsx("transition-colors hover:text-slate-700", pathname?.startsWith("/categories") ? "text-slate-900" : "text-gray-400")}>
              Categories
            </Link>
            <Link href="/about" className={clsx("transition-colors hover:text-slate-700", pathname?.startsWith("/about") ? "text-slate-900" : "text-gray-400")}>
              About
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center">
            <Link href={"https://twitter.com/yongyuandebenp2"} target="_blank" rel="noreferrer" className="w-10">
              <Twitter size={"1.2rem"} className="m-auto" />
            </Link>
            <Link href={"https://github.com/yjrhgvbn"} target="_blank" rel="noreferrer" className="w-10">
              <GithubIcon size={"1.2rem"} className="m-auto" />
            </Link>
            <Button variant="ghost" size="icon">
              <SunIcon size={"1.2rem"} />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
