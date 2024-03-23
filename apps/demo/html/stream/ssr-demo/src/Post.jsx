import React from "react";

let status = "pending";
const useQueryData = () => {
  if (status === "pending") {
    throw new Promise((resolve) => {
      setTimeout(() => {
        status = "done";
        resolve();
      }, 1000);
    });
  }
  return 'done';
};

export function Post() {
  useQueryData();
  return <div>this is a post</div>;
}
export default Post;
