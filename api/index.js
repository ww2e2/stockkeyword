import { requestHandler } from '../src/app.js';

export default async function handler(req, res) {
  return requestHandler(req, res);
}
