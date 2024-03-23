import { renderToPipeableStream } from 'react-dom/server';
import React from "react";
import App from './App';

export function render({ res }) {
  const Document = () => (
    <html>
      <body id="app">
        <App />
      </body>
    </html>
  );

  const { pipe, abort } = renderToPipeableStream(<Document />, {

    onShellReady() {
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      pipe(res);
    },

    onShellError(error) {
      res.statusCode = 500;
      res.send(
        `<!doctype html><p>An error ocurred:</p><pre>${error.message}</pre>`,
      );
    },
  });

  setTimeout(abort, 2000);
}
