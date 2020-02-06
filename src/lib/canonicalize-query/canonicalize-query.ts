export const canonicalizeQuery = (query: any): any => {
  const encodeComponent = (component: any) =>
    encodeURIComponent(component)
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');

  const join = (key: any, value: any) => encodeComponent(key) + '=' + encodeComponent(value);

  return Object.keys(query)
    .map(key => {
      const value = query[key];
      if (typeof value === 'string') {
        return join(key, value);
      }
      return value
        .sort()
        .map((oneValue: any) => join(key, oneValue))
        .join('&');
    })
    .sort()
    .join('&');
};
