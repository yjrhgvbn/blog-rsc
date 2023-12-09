"use client";
import { useCopyToClipboard, useTimeout } from "react-use";
// import { Button } from 'components';

interface CopyButtonProperties {
  text: string;
}

export const CopyButton = (properties: CopyButtonProperties) => {
  const { text } = properties;
  const [copied, copyToClipboard] = useCopyToClipboard();
  const [isReady, , reset] = useTimeout(3000);

  const handleCopy = () => {
    copyToClipboard(text);
    reset();
  };

  return (
    <button onClick={handleCopy} className="mx-5">
      {!isReady() && copied.value === text ? "Copied" : "Copy"}
    </button>
  );
};

export default CopyButton;
