import { networkInterfaces } from 'node:os';

/**
 * Addresses this server can be reached on from the machine itself, plus the LAN
 * addresses when it listens on all interfaces. Used for the startup banner and the host allow-list.
 */
export function listLocalUrls(port, bindHost) {
  const urls = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  if (bindHost !== '0.0.0.0') return urls;

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) urls.push(`http://${address.address}:${port}`);
    }
  }
  return urls;
}

/** "host:port" part of a URL, which is what browsers send in the Host header. */
export const hostOfUrl = (url) => new URL(url).host;
