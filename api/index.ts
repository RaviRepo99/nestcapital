import * as serverModule from '../dist/server.cjs';

const loadedModule = serverModule as any;
const app = typeof loadedModule === 'function'
  ? loadedModule
  : typeof loadedModule.default === 'function'
    ? loadedModule.default
    : loadedModule.default?.default;

export default function handler(req: any, res: any) {
  const apiPath = typeof req.query?.path === 'string' ? req.query.path : '';
  if (apiPath) {
    const queryIndex = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
    const query = queryIndex >= 0 ? new URLSearchParams(req.url.slice(queryIndex + 1)) : new URLSearchParams();
    query.delete('path');
    const queryString = query.toString();
    req.url = `/api/${apiPath}${queryString ? `?${queryString}` : ''}`;
    req.originalUrl = req.url;
  }

  return app(req, res);
}
