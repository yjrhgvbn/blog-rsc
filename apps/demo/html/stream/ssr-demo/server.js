import express from 'express';
export async function createServer() {
  const app = express();
  app.use('*', async (req, res) => {
    try {
      const render = (await import('./dist/server/entry-server.js')).render
      return render({
        res,
        req,
      });
    } catch (e) {
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app };
}
const Port = 51776;
createServer().then(({ app }) =>
  app.listen(Port, () => {
    console.log(`http://localhost:${Port}`);
  }),
);
