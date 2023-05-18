export class Buffer {
  private cursor = 0;

  constructor(private buffer: ArrayBuffer) {}

  readBytes(size: number): Uint8Array {
    if (this.buffer.byteLength < this.cursor + size) {
      return new Uint8Array(0);
    }

    const slice = this.buffer.slice(this.cursor, this.cursor + size);
    this.cursor += size;
    return new Uint8Array(slice);
  }
}
