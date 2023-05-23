const buffer = new ArrayBuffer(8);

const magic = new Uint8Array([0x00, 0x61, 0x73, 0x6d]);

console.log({ magic });

const view1 = new Uint8Array(buffer);
view1[0] = 0x0a;
console.log({ view1 });
const view2 = new Uint8Array(buffer);
view2[1] = 0x0b;
console.log({ view1, view2 });

const view3 = new Uint8Array([0x00, 0x61]);
const view4 = new Uint8Array([0x00, 0x61]);

console.log({ view3, view4, eq: view3 === view4 });

const version = new Uint8Array([0x01, 0x00, 0x00, 0x00]);

// Uint8Arrayのマージ
const magicAndVersion = new Uint8Array([...magic, ...version]);
console.log({
  magicAndVersion,
  magic,
  version,
  byteLength: magicAndVersion.byteLength,
  length: magicAndVersion.length,
});

// Uint8Arrayのマージ、片方にもう片方を追加する
function mergeTypedArray(
  view1: Uint8Array,
  offset: number,
  view2: Uint8Array
): void {
  view1.set(view2, offset);
}

const view5 = new Uint8Array(8);
const view6 = new Uint8Array([0x01, 0x00, 0x00, 0x00]);

mergeTypedArray(view5, 4, view6);

console.log({ view5, view6 });
