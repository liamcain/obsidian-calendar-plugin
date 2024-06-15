// Always use / for join to simplify cross-platform unit testing
export function join(pathA: string, pathB: string): string {
  return `${pathA}/${pathB}`;
}
