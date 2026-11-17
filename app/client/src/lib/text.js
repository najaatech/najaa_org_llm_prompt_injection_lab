/** Text to show for any value: strings as they are, objects as indented JSON, nothing as an empty string. */
export const textOf = (value) => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};
