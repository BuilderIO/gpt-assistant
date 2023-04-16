export function removeNthQueryParams(url: string, n: number) {
  // Parse the URL using the URL constructor
  const parsedUrl = new URL(url);

  // Get the search parameters from the parsed URL
  const searchParams = parsedUrl.searchParams;

  // Convert the search parameters to an array of key-value pairs
  const paramsArray = Array.from(searchParams.entries());

  // Clear all existing search parameters
  searchParams.forEach((value, key) => {
    searchParams.delete(key);
  });

  // Add back only the first n query parameters
  for (let i = 0; i < Math.min(n, paramsArray.length); i++) {
    const [key, value] = paramsArray[i];
    searchParams.append(key, value);
  }

  return parsedUrl.href;
}
