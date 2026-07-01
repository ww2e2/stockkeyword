import http from 'http';
import { pathToFileURL } from 'url';
import requestHandler, { requestHandler as namedRequestHandler } from './crowdpicWrapper.js';

const PORT = Number(process.env.PORT || 3000);
const DEBUG = String(process.env.DEBUG || 'false').toLowerCase() === 'true';

export { namedRequestHandler as requestHandler };
export const server = http.createServer(namedRequestHandler);
export default requestHandler;

function isMainModule() {
  const entryPath = process.argv[1];
  if (!entryPath) {
    return false;
  }

  return import.meta.url === pathToFileURL(entryPath).href;
}

if (isMainModule()) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Miricanvas tag SaaS listening on ${PORT}`);
    if (DEBUG) {
      console.log('MIRICANVAS_API_URL:', process.env.MIRICANVAS_API_URL);
    }
  });
}

