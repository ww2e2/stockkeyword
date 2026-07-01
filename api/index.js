import { requestHandler } from '../src/crowdpicWrapper.js';

export default async function handler(req, res) {
  if (typeof res?.setHeader === 'function') {
    res.setHeader('x-handler-entry', 'api-index');
  }
  return requestHandler(req, res);
}

