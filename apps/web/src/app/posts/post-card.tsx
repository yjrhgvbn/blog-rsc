import Link from "next/link";
import Image from "next/image";
interface PostCardProps {
  title: string;
  href: string;
  content?: string;
  time?: string;
  url?: string;
  img?: string;
}

export function PostCard(props: PostCardProps) {
  const { title, href, time, img, content } = props;
  return (
    <section className="mb-8 overflow-hidden max-h-60 min-h-[10rem] flex">
      <div className="lg:px-8 px-4 pt-4 flex-1">
        <h1 className="mb-3 break-words text-2xl font-bold leading-tight text-slate-900 dark:text-white lg:text-3xl">
          <Link aria-label={title} href={href} className="line-clamp-2">
            {title}
          </Link>
        </h1>
        <div className="mb-3 flex flex-row flex-wrap items-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-4">
          <a aria-label={time} className="flex flex-row items-center gap-x-4" href={href}>
            <span className="blog-post-card-time">{time}</span>
          </a>
        </div>
        <div className="block break-words text-lg leading-snug text-slate-700 dark:text-slate-400">
          <Link aria-label={content} href={href} className="line-clamp-4">
            {content}
          </Link>
        </div>
      </div>
      {img && (
        <div className="hidden sm:block text-right rounded-md overflow-hidden ">
          <Link href={href} aria-label={title} className="">
            <Image alt={title} loading="lazy" decoding="async" data-nimg="responsive" src={img} className="object-cover h-full max-h-60" />
          </Link>
        </div>
      )}
    </section>
  );
}
