export class Buffer {
  protected cursor = 0;
  private view!: DataView;
  public buffer!: ArrayBuffer;

  constructor({ buffer }: { buffer: ArrayBuffer }) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
  }

  readBytes(size: number): Uint8Array {
    if (this.buffer.byteLength < this.cursor + size) {
      return new Uint8Array(0);
    }

    const slice = this.buffer.slice(this.cursor, this.cursor + size);
    this.cursor += size;
    return new Uint8Array(slice);
  }

  writeBytes(bytes: ArrayBuffer) {
    const u8s = new Uint8Array(bytes);
    for (const byte of u8s) {
      this.writeByte(byte);
    }
  }

  readByte(): number {
    const bytes = this.readBytes(1);
    if (bytes.length <= 0) {
      return -1;
    }
    return bytes[0];
  }

  writeByte(byte: number) {
    this.view.setUint8(this.cursor++, byte);
  }

  readU32(): number {
    let result = 0;
    let shift = 0;

    while (true) {
      const byte = this.readByte();
      result |= (byte & 0b1111111) << shift;
      shift += 7;
      if ((0b10000000 & byte) === 0) {
        return result;
      }
    }
  }

  writeU32(value: number) {
    value |= 0;
    const result = [];
    while (true) {
      const byte = value & 0b01111111;
      value >>= 7;
      if (value === 0 && (byte & 0b01000000) === 0) {
        result.push(byte);
        break;
      }
      result.push(byte | 0b10000000);
    }
    const u8a = new Uint8Array(result);
    this.writeBytes(u8a.buffer);
  }

  readS32(): number {
    // https://en.wikipedia.org/wiki/LEB128#Decode_signed_32-bit_integer
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = this.readByte();
      if (byte < 0) throw new Error("fail to read buffer");

      result |= (byte & 0b01111111) << shift;
      shift += 7;
      if ((0b10000000 & byte) === 0) {
        if (shift < 32 && (byte & 0b01000000) !== 0) {
          return result | (~0 << shift);
        }
        return result;
      }
    }
  }

  writeS32(value: number) {
    // https://en.wikipedia.org/wiki/LEB128#Encode_signed_32-bit_integer
    value |= 0;
    const result = [];
    while (true) {
      const byte = value & 0b01111111;
      value >>= 7;
      if (
        (value === 0 && (byte & 0b01000000) === 0) ||
        (value === -1 && (byte & 0b01000000) !== 0)
      ) {
        result.push(byte);
        break;
      }
      result.push(byte | 0b10000000);
    }
    const u8a = new Uint8Array(result);
    this.writeBytes(u8a.buffer);
  }

  readI32(): number {
    return this.readS32();
  }

  writeI32(num: number) {
    this.writeS32(num);
  }

  readBuffer(size: number = this.buffer.byteLength - this.cursor): Buffer {
    return new Buffer(this.readBytes(size));
  }

  readVec<T>(readT: () => T): T[] {
    const vec = [];
    const size = this.readU32();
    for (let i = 0; i < size; i++) {
      vec.push(readT());
    }
    return vec;
  }

  writeVec<T>(ts: T[], writeT: (t: T) => void) {
    this.writeU32(ts.length);
    for (const t of ts) {
      writeT(t);
    }
  }

  readName(): string {
    const size = this.readU32();
    const bytes = this.readBytes(size);
    return new TextDecoder("utf-8").decode(bytes.buffer);
  }

  writeName(name: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(name);
    this.writeU32(bytes.length);
    this.writeBytes(bytes);
  }

  peek(pos = 0): number {
    return this.view.getUint8(pos);
  }

  append(buffer: Buffer) {
    this.writeU32(buffer.cursor);
    for (let i = 0; i < buffer.cursor; i++) {
      this.writeByte(buffer.peek(i));
    }
  }

  get byteLength(): number {
    return this.buffer.byteLength;
  }

  get eof(): boolean {
    return this.byteLength <= this.cursor;
  }
}

export class StackBuffer extends Buffer {
  readBytes(size: number): Uint8Array {
    if (this.cursor - size < 0) {
      return new Uint8Array(0);
    }
    const slice = this.buffer.slice(this.cursor - size, this.cursor);
    this.cursor = this.cursor - size;
    return new Uint8Array(slice).reverse();
  }

  writeBytes(bytes: ArrayBuffer): void {
    const u8s = new Uint8Array(bytes).reverse();
    for (const byte of u8s) {
      this.writeByte(byte);
    }
  }
}
