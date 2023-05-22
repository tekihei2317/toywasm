import {
  fromFileUrl,
  dirname,
  join,
} from "https://deno.land/std@0.188.0/path/mod.ts";

export function fromRelativePath(relativePath: string): string {
  const dir = dirname(fromFileUrl(import.meta.url));
  return join(dir, relativePath);
}
