// markdown 组件
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { rehypeHighlight, remarkMarkCode, codeHandler } from "./plugin";
import type React from "react";
import { useCallback } from "react";
import { CopyButton } from "./CopyButton";

// const LazySandpack = lazy(async () => import("./Sandpack"));
import Sandpack from "./Sandpack";

export interface MarkdownProperties {
  source: string;
}
export const Typography = ({ source }: MarkdownProperties) => {
  const ReactMarkdownComponents = useCallback((codeProperties: any) => {
    const { children, className, node } = codeProperties;
    const match = /language-(\w+)/.exec(className || "");
    if (!match) {
      return <code className={clsx("mx-1 rounded-md bg-gray-200 px-1 py-1 ")}>{children}</code>;
    }
    const files: Record<string, string> = node.data?.files as Record<string, string>;
    // 是否标记了文件，标记了多个会合并展示
    const isFileMarked = node.data?.isFileMarked as boolean;
    // 合并其他文件到第一个文件展示
    const isFirstFile = node.data?.isFirstFile as boolean;
    const isShow = isFileMarked ? isFirstFile : true;
    const template: any = node.data?.template || "vanilla";
    if (isFileMarked) {
      return (
        <Sandpack files={files} isShow={isShow} template={template}>
          {children as JSX.Element}
        </Sandpack>
      );
    }
    const language = (node.data?.language as string) || "";
    const codeContent = (node.data?.codeContent as string) || "";
    return (
      <div className={clsx("rounded-md border bg-white not-format overflow-hidden")}>
        {language ? (
          <div className={clsx("flex w-full items-center justify-between border-b ")}>
            <span className={clsx("mx-5 my-0 h-full select-none py-1 text-slate-800")}>{language}</span>
            <CopyButton text={codeContent} />
          </div>
        ) : null}
        <pre className={clsx("overflow-auto py-2 px-4 bg-[#1e1e1e]")}>
          <code className="text-sm text-[#DCDCDC]">{children}</code>
        </pre>
      </div>
    );
  }, []);

  const preComponent = useCallback((properties: any) => {
    return <div className={clsx("w-full overflow-auto my-7")}>{properties.children}</div>;
  }, []);

  return (
    <article className={"mx-auto w-full max-w-3xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert"}>
      <ReactMarkdown
        components={{
          code: ReactMarkdownComponents,
          pre: preComponent,
        }}
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm, remarkMarkCode]}
        remarkRehypeOptions={{ handlers: { code: codeHandler } }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
};

export default Typography;
