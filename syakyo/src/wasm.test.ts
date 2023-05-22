import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { WasmModule, WasmBuffer } from "./wasm.ts";
import { fromRelativePath } from "./path.ts";

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

Deno.test("load local.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/local.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(3, wasmModule.sections.length);
});

Deno.test("load add.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/add.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(4, wasmModule.sections.length);
});

Deno.test("load if.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/if.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(4, wasmModule.sections.length);
});

Deno.test("load loop.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/loop.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(4, wasmModule.sections.length);
});

Deno.test("load call.wat", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/call.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();

  wasmModule.load(wasmBuffer);
  assertEquals(4, wasmModule.sections.length);
});
