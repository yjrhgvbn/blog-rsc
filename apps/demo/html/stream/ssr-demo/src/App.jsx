import React, { Suspense } from "react";
const Post = React.lazy(() => import("./Post"));
const Post2 = React.lazy(() => import("./Post"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Post />
    </Suspense>
  );
}

export default App;
