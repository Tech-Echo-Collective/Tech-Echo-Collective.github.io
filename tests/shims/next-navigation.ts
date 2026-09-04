export function redirect(destination: string | URL): never {
  throw new Error(`NEXT_REDIRECT:${String(destination)}`);
}
