import { Context } from "./instance.ts";
import {
  BlockInstrNode,
  LoopInstrNode,
  IfInstrNode,
  BrInstrNode,
  BrIfInstrNode,
  CallInstrNode,
  I32ConstInstrNode,
  I32EqzInstrNode,
  I32LtSInstrNode,
  I32GeSInstrNode,
  I32AddInstrNode,
  I32RemSInstrNode,
  LocalGetInstrNode,
  LocalSetInstrNode,
  InstrNode,
} from "./instruction-node.ts";

export class Instruction {
  parent?: Instruction;
  #next?: Instruction;

  constructor(parent?: Instruction) {
    this.parent = parent;
  }

  get next(): Instruction | undefined {
    if (this.#next) {
      return this.#next;
    } else {
      return this.parent?.next;
    }
  }

  set next(instr: Instruction | undefined) {
    this.#next = instr;
  }

  static create(node: InstrNode, parent?: Instruction): Instruction {
    if (node instanceof I32ConstInstrNode) {
      return new I32ConstInstruction(node, parent);
    } else if (node instanceof I32EqzInstrNode) {
      return new I32EqzInstruction(node, parent);
    } else if (node instanceof I32LtSInstrNode) {
      return new I32LtSInstruction(node, parent);
    } else if (node instanceof I32GeSInstrNode) {
      return new I32GeSInstruction(node, parent);
    } else if (node instanceof I32AddInstrNode) {
      return new I32AddInstruction(node, parent);
    } else if (node instanceof I32RemSInstrNode) {
      return new I32RemSInstruction(node, parent);
    } else if (node instanceof LocalGetInstrNode) {
      return new LocalGetInstruction(node, parent);
    } else if (node instanceof LocalSetInstrNode) {
      return new LocalSetInstruction(node, parent);
    }
    throw new Error(`invalid node: ${node.constructor.name}`);
  }

  invoke(context: Context): Instruction | undefined {
    throw new Error(`subclass responsibility: ${this.constructor.name}`);
  }
}

export class InstructionSeq extends Instruction {
  #instructions: Instruction[] = [];

  constructor(nodes: InstrNode[] = [], parent?: Instruction) {
    super();
    if (nodes.length === 0) return;

    let prev = Instruction.create(nodes[0], parent);
    this.#instructions.push(prev);

    for (let i = 1; i < nodes.length; i++) {
      prev.next = Instruction.create(nodes[i], parent);
      this.#instructions.push(prev);
      prev = prev.next;
    }
  }

  get top(): Instruction | undefined {
    return this.#instructions[0];
  }

  invoke(context: Context): Instruction | undefined {
    return this.top;
  }
}

class LocalGetInstruction extends Instruction {
  private localIdx: number;

  constructor(node: LocalGetInstrNode, parent?: Instruction) {
    super(parent);
    this.localIdx = node.localIdx;
  }

  invoke(context: Context) {
    const local = context.locals[this.localIdx];
    local.store(context.stack);
    return this.next;
  }
}

class LocalSetInstruction extends Instruction {
  private localIdx: number;

  constructor(node: LocalSetInstrNode, parent?: Instruction) {
    super(parent);
    this.localIdx = node.localIdx;
  }

  invoke(context: Context) {
    const local = context.locals[this.localIdx];
    local.load(context.stack);
    return this.next;
  }
}

class I32ConstInstruction extends Instruction {
  num: number;

  constructor(node: I32ConstInstrNode, parent?: Instruction) {
    super(parent);
    this.num = node.num;
  }

  invoke(context: Context): Instruction | undefined {
    context.stack.writeI32(this.num);
    return this.next;
  }
}

class I32AddInstruction extends Instruction {
  constructor(node: I32AddInstrNode, parent?: Instruction) {
    super(parent);
  }

  invoke(context: Context): Instruction | undefined {
    const rhs = context.stack.readI32();
    const lhs = context.stack.readI32();
    context.stack.writeI32(lhs + rhs);
    return this.next;
  }
}

class I32RemSInstruction extends Instruction {
  constructor(node: I32RemSInstrNode, parent?: Instruction) {
    super(parent);
  }

  invoke(context: Context): Instruction | undefined {
    const rhs = context.stack.readS32();
    const lhs = context.stack.readS32();
    context.stack.writeS32(lhs % rhs);
    return this.next;
  }
}

class I32EqzInstruction extends Instruction {
  constructor(node: I32EqzInstrNode, parent?: Instruction) {
    super(parent);
  }

  invoke(context: Context): Instruction | undefined {
    const num = context.stack.readS32();
    context.stack.writeI32(num === 0 ? 1 : 0);
    return this.next;
  }
}

class I32LtSInstruction extends Instruction {
  constructor(node: I32LtSInstrNode, parent?: Instruction) {
    super(parent);
  }

  invoke(context: Context): Instruction | undefined {
    const rhs = context.stack.readS32();
    const lhs = context.stack.readS32();
    context.stack.writeI32(lhs < rhs ? 1 : 0);
    return this.next;
  }
}

class I32GeSInstruction extends Instruction {
  constructor(node: I32GeSInstrNode, parent?: Instruction) {
    super(parent);
  }

  invoke(context: Context): Instruction | undefined {
    const rhs = context.stack.readS32();
    const lhs = context.stack.readS32();
    context.stack.writeI32(lhs >= rhs ? 1 : 0);
    return this.next;
  }
}
