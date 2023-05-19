import {
  fromFileUrl,
  dirname,
  join,
} from "https://deno.land/std@0.188.0/path/mod.ts";

console.log(import.meta.url);
console.log(fromFileUrl(import.meta.url));
console.log(dirname(fromFileUrl(import.meta.url)));
console.log(join("/hoge", "fuga"));
