"use client";
import type { SandpackFiles, SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import clsx from "clsx";
import { githubLight } from "@codesandbox/sandpack-themes";
import { CopyButton } from "./CopyButton";

interface SandpackProperties {
  files: SandpackFiles;
  template?: SandpackPredefinedTemplate;
  children?: JSX.Element;
  isShow?: boolean;
  language?: string;
}

export const Sandpack = (property: SandpackProperties) => {
  const { template = "static", files = {}, isShow = false } = property;
  if (!isShow) return null;
  return (
    <SandpackProvider files={files} template={template} theme={githubLight}>
      <CustomTabs fieldList={Object.keys(files)} />
      <SandpackLayout>
        <SandpackCodeEditor showInlineErrors showTabs={false} wrapContent />
        <SandpackPreview />
      </SandpackLayout>
    </SandpackProvider>
  );
};

interface CustomTabsProperties {
  fieldList: string[];
}
const CustomTabs = (properties: CustomTabsProperties) => {
  const { sandpack } = useSandpack();
  const { files, activeFile } = sandpack;
  const { fieldList } = properties;
  const activeTab = activeFile.slice(1);

  const handleTabChange = (tab: string) => {
    sandpack.setActiveFile(`/${tab}`);
  };

  const handleReset = () => {
    sandpack.resetAllFiles();
  };
  return (
    <div className={clsx("relative z-50 -mb-1 h-12 bg-white text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400", "rounded-t border-[1px] border-[#EFEFEF] ", "flex justify-between")}>
      <div className={clsx("flex flex-wrap")}>
        {fieldList.map((field) => (
          <button key={field} className={clsx("inline-block pl-4  hover:text-gray-600 dark:hover:text-gray-300", field === activeTab && " text-blue-600")} onClick={() => handleTabChange(field)} type="button">
            {field}
          </button>
        ))}
      </div>
      <div className={clsx("mr-2 flex items-center")}>
        <CopyButton text={files[activeFile]?.code || ""} />
        <button onClick={handleReset}>Rest</button>
      </div>
    </div>
  );
};

export default Sandpack;
