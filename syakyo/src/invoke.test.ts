import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { fromRelativePath } from "./path.ts";
import { WasmModule, WasmBuffer } from "./wasm.ts";

Deno.test("invoke add.wasm", async () => {
  const code = await Deno.readFile(fromRelativePath("../data/add.wasm"));
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();
  wasmModule.load(wasmBuffer);

  const instance = wasmModule.instantiate();
  const add = instance.exports.add;
  assertEquals(3, add(1, 2));
  assertEquals(300, add(100, 200));
  assertEquals(1, add(2, -1));
  assertEquals(100, add(200, -100));
});
