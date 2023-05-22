# syakyo

[作って学ぶWebAssembly](https://www.amazon.co.jp/dp/B09BMQ87KK)を写経しているものです。

## メモ

[Node.js / Denoで始める手書きWebAssembly - Qiita](https://qiita.com/syumai/items/b0925e63ba2cf2fd5f2b)

Node.jsは、`--experimental-wasm-modules`フラグをつけるとWasmバイナリ(.wasm)をJSからインポートできます。Denoでの方法は分かりませんでした。m

```bash
# Wasmバイナリの実行
node --experimental-wasm-modules exec-wat.mjs
```
