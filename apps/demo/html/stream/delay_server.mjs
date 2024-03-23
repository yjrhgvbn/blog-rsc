import http from "http";

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write("<div>loading</div>");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  res.write("<div>done</div>");
  res.end();
});
console.log("Server running at http://localhost:8080/");
server.listen(8080);
