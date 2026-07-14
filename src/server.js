import http from 'http';
import { requestHandler } from './app.js';

const PORT = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    console.error('Unhandled request error:', error?.message || String(error));

    if (!res.headersSent && !res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`miricanvas-tag-saas listening on ${PORT}`);
});
