import { Buffer } from "./buffer.ts";
import { BlockType, FuncIdx, LabelIdx, Op } from "./type.ts";

export class InstrNode {
  opcode: Op;

  static create(opcode: Op): InstrNode | null {
    switch (opcode) {
      case Op.Block:
        return new BlockInstrNode(opcode);
      case Op.Loop:
        return new LoopInstrNode(opcode);
      case Op.If:
        return new IfInstrNode(opcode);
      case Op.Br:
        return new BrInstrNode(opcode);
      case Op.BrIf:
        return new BrIfInstrNode(opcode);
      case Op.Call:
        return new CallInstrNode(opcode);
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

export class ExprNode {
  instrs: InstrNode[] = [];
  endOp!: Op;

  load(buffer: Buffer) {
    while (true) {
      const opcode = buffer.readByte() as Op;
      if (opcode === Op.End || opcode === Op.Else) {
        this.endOp = opcode;
        break;
      }

      const instr = InstrNode.create(opcode);
      if (!instr) {
        throw new Error(`invalid opcode: 0x${opcode.toString(16)}`);
      }
      instr.load(buffer);
      this.instrs.push(instr);

      if (buffer.eof) break;
    }
  }
}

export class IfInstrNode extends InstrNode {
  blockType!: BlockType;
  thenInstrs!: ExprNode;
  elseInstrs?: ExprNode;

  load(buffer: Buffer) {
    this.blockType = buffer.readByte();
    this.thenInstrs = new ExprNode();
    this.thenInstrs.load(buffer);
    if (this.thenInstrs.endOp === Op.Else) {
      this.elseInstrs = new ExprNode();
      this.elseInstrs.load(buffer);
    }
  }
}

export class BlockInstrNode extends InstrNode {
  blockType!: BlockType;
  instrs!: ExprNode;

  load(buffer: Buffer) {
    this.blockType = buffer.readByte();
    this.instrs = new ExprNode();
    this.instrs.load(buffer);
  }
}

export class LoopInstrNode extends InstrNode {
  blockType!: BlockType;
  instrs!: ExprNode;

  load(buffer: Buffer) {
    this.blockType = buffer.readByte();
    this.instrs = new ExprNode();
    this.instrs.load(buffer);
  }
}

export class BrInstrNode extends InstrNode {
  labelIdx!: LabelIdx;

  load(buffer: Buffer) {
    this.labelIdx = buffer.readU32();
  }
}

export class BrIfInstrNode extends InstrNode {
  labelIdx!: LabelIdx;

  load(buffer: Buffer) {
    this.labelIdx = buffer.readU32();
  }
}

export class CallInstrNode extends InstrNode {
  funcIdx!: FuncIdx;

  load(buffer: Buffer) {
    this.funcIdx = buffer.readU32();
  }
}
