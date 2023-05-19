import { Buffer } from "./buffer.ts";
import { ValType, Op } from "./type.ts";
import { InstrNode } from "./instruction.ts";

export abstract class SectionNode {
  static create(sectionId: number): SectionNode {
    switch (sectionId) {
      case 1:
        return new TypeSectionNode();
      case 3:
        return new FunctionSectionNode();
      case 10:
        return new CodeSectionNode();
      default:
        throw new Error(`invalid section id: ${sectionId}`);
    }
  }

  abstract load(buffer: Buffer): void;
}

export class ResultTypeNode {
  valTypes: ValType[] = [];

  load(buffer: Buffer) {
    this.valTypes = buffer.readVec<ValType>(() => {
      return buffer.readByte() as ValType;
    });
  }
}

export class FuncTypeNode {
  static readonly TAG = 0x60;

  paramType = new ResultTypeNode();
  resultType = new ResultTypeNode();

  load(buffer: Buffer) {
    if (buffer.readByte() !== FuncTypeNode.TAG) {
      throw new Error("invalid functype");
    }
    this.paramType = new ResultTypeNode();
    this.paramType.load(buffer);
    this.resultType = new ResultTypeNode();
    this.resultType.load(buffer);
  }
}

type TypeIdx = number;

export class TypeSectionNode extends SectionNode {
  funcTypes: FuncTypeNode[] = [];

  load(buffer: Buffer) {
    this.funcTypes = buffer.readVec<FuncTypeNode>(() => {
      const funcType = new FuncTypeNode();

      funcType.load(buffer);

      return funcType;
    });
  }
}

export class FunctionSectionNode extends SectionNode {
  typeIndexes: TypeIdx[] = [];

  load(buffer: Buffer) {
    this.typeIndexes = buffer.readVec<TypeIdx>(() => {
      return buffer.readU32();
    });
  }
}

export class LocalsNode {
  num!: number;
  valType!: ValType;

  load(buffer: Buffer) {
    this.num = buffer.readU32();
    this.valType = buffer.readByte() as ValType;
  }
}

export class ExprNode {
  instrs: InstrNode[] = [];
  endOp!: Op;

  load(buffer: Buffer) {
    while (true) {
      const opcode = buffer.readByte() as Op;
      if (opcode === Op.End) {
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

export class FuncNode {
  localses: LocalsNode[] = [];
  expr?: ExprNode;

  load(buffer: Buffer) {
    this.localses = buffer.readVec<LocalsNode>(() => {
      const locals = new LocalsNode();
      locals.load(buffer);
      return locals;
    });
    this.expr = new ExprNode();
    this.expr.load(buffer);
  }
}

export class CodeNode {
  size?: number;
  func?: FuncNode;

  load(buffer: Buffer) {
    this.size = buffer.readU32();
    const funcBuffer = buffer.readBuffer(this.size);
    this.func = new FuncNode();
    this.func.load(funcBuffer);
  }
}

export class CodeSectionNode extends SectionNode {
  codes: CodeNode[] = [];

  load(buffer: Buffer) {
    this.codes = buffer.readVec<CodeNode>(() => {
      const code = new CodeNode();
      code.load(buffer);
      return code;
    });
  }
}
