import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { WasmModule, WasmBuffer } from "./wasm.ts";
import {
  fromFileUrl,
  dirname,
  join,
} from "https://deno.land/std@0.188.0/path/mod.ts";

function fromRelativePath(relativePath: string): string {
  const dir = dirname(fromFileUrl(import.meta.url));
  return join(dir, relativePath);
}

Deno.test("load module.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/module.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(new Uint8Array([0x00, 0x61, 0x73, 0x6d]), wasmModule.magic);
  assertEquals(new Uint8Array([0x01, 0x00, 0x00, 0x00]), wasmModule.version);
});

Deno.test("load const.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/const.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();
  wasmModule.load(wasmBuffer);
  assertEquals(3, wasmModule.sections.length);
});