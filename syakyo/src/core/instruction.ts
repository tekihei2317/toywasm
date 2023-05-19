import { Buffer } from "./buffer.ts";
import { Op } from "./type.ts";

export class InstrNode {
  opcode: Op;

  static create(opcode: Op): InstrNode | null {
    switch (opcode) {
      case Op.I32Const:
        return new I32ConstInstrNode(opcode);
      default:
        return null;
    }
  }

  constructor(opcode: Op) {
    this.opcode = opcode;
  }

  load(buffer: Buffer) {}
}

export class I32ConstInstrNode extends InstrNode {
  num!: number;

  load(buffer: Buffer) {
    this.num = buffer.readI32();
  }
}
