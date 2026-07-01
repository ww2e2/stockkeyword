import { requestHandler } from '../src/crowdpicWrapper.js';

export default async function handler(req, res) {
  return requestHandler(req, res);
}

