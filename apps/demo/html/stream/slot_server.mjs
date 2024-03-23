
import http from "http";

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write(`<body>
  <template shadowrootmode="open">
    <slot name="content">loading</slot>
  </template>
</body>`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  res.write(`<div slot="content">done</div>`);
  res.end();
});
console.log("Server running at http://localhost:8080/");
server.listen(8080);
