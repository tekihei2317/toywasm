import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { fromRelativePath } from "./path.ts";
import { WasmModule, WasmBuffer } from "./wasm.ts";

async function loadModule(wasmPath: string): Promise<{
  wasmModule: WasmModule;
  wasmBuffer: WasmBuffer;
  code: Uint8Array;
}> {
  const code = await Deno.readFile(wasmPath);
  const wasmBuffer = new WasmBuffer(code);
  const wasmModule = new WasmModule();
  wasmModule.load(wasmBuffer);
  return { wasmModule, wasmBuffer, code };
}

Deno.test("store module.wasm", async () => {
  const { wasmModule, wasmBuffer, code } = await loadModule(
    fromRelativePath("../data/module.wasm")
  );
  const newCode = new Uint8Array(wasmBuffer.byteLength);
  const newBuffer = new WasmBuffer(newCode);
  wasmModule.store(newBuffer);

  assertEquals(code, newCode);
});

Deno.test("store const.wasm", async () => {
  const { wasmModule, wasmBuffer, code } = await loadModule(
    fromRelativePath("../data/const.wasm")
  );
  const newCode = new Uint8Array(wasmBuffer.byteLength);
  const newBuffer = new WasmBuffer(newCode);
  wasmModule.store(newBuffer);

  assertEquals(code, newCode);
});
