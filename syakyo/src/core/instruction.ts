import { Buffer } from "./buffer.ts";
import { Op } from "./type.ts";

export class InstrNode {
  opcode: Op;

  static create(opcode: Op): InstrNode | null {
    switch (opcode) {
      case Op.LocalGet:
        return new LocalGetInstrNode(opcode);
      case Op.LocalSet:
        return new LocalSetInstrNode(opcode);
      case Op.I32Const:
        return new I32ConstInstrNode(opcode);
      case Op.I32Eqz:
        return new I32EqzInstrNode(opcode);
      case Op.I32LtS:
        return new I32LtSInstrNode(opcode);
      case Op.I32GeS:
        return new I32GeSInstrNode(opcode);
      case Op.I32Add:
        return new I32AddInstrNode(opcode);
      case Op.I32RemS:
        return new I32RemSInstrNode(opcode);
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

export class I32AddInstrNode extends InstrNode {}

export class I32EqzInstrNode extends InstrNode {}

export class I32LtSInstrNode extends InstrNode {}

export class I32GeSInstrNode extends InstrNode {}

export class I32RemSInstrNode extends InstrNode {}

export class LocalGetInstrNode extends InstrNode {
  localIdx!: number;

  load(buffer: Buffer) {
    this.localIdx = buffer.readU32();
  }
}

export class LocalSetInstrNode extends InstrNode {
  localIdx!: number;

  load(buffer: Buffer) {
    this.localIdx = buffer.readU32();
  }
}
