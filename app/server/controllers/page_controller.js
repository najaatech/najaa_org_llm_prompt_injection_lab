import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { httpError } from '../utils/http_error.js';

/** GET /: serves the built web app with this request's CSP nonce filled in. */
export async function page_index(req, res, next) {
  const { distDir } = req.app.locals.services;
  try {
    const html = await readFile(join(distDir, 'index.html'), 'utf8');
    res
      .set('Cache-Control', 'no-store')
      .type('html')
      .send(html.replaceAll('__CSP_NONCE__', res.locals.cspNonce));
  } catch {
    next(httpError('The web interface is not built yet. Run: npm run build', 503));
  }
}
