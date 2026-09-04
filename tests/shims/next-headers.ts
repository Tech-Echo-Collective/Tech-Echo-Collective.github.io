export async function cookies() {
  return {
    get: (_name: string) => undefined,
    set: () => undefined,
    delete: () => undefined,
  };
}

export async function headers() {
  return new Headers();
}
