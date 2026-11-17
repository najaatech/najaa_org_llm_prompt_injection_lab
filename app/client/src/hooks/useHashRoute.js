import { useEffect, useState } from 'react';

const routeFromHash = () => window.location.hash.replace('#', '') || 'start';

/** The current page id, taken from the URL hash. `onChange` runs after every navigation. */
export function useHashRoute(onChange) {
  const [route, setRoute] = useState(routeFromHash);

  useEffect(() => {
    const onHash = () => { setRoute(routeFromHash()); onChange?.(); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [onChange]);

  return route;
}
