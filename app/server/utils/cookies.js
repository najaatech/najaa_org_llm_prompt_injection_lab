/** Reads one cookie value from the request, or undefined when it is not present. */
export function readCookie(req, name) {
  const prefix = `${name}=`;
  const pair = (req.get('cookie') || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return pair?.slice(prefix.length);
}
