import { ModuleNode } from "./module.ts";
import { CodeNode, FuncTypeNode } from "./section.ts";
import { Buffer, StackBuffer } from "./buffer.ts";
import { InstructionSeq } from "./instruction.ts";

export class Instance {
  private context: Context;

  constructor(
    private module: ModuleNode,
    // deno-lint-ignore no-explicit-any
    public readonly exports: { [key: string]: any } = {}
  ) {
    this.context = new Context();
  }

  compile() {
    const typeSection = this.module.typeSection;
    const codeSection = this.module.codeSection;

    const functionSection = this.module.functionSection;
    functionSection?.typeIndexes.forEach((typeIdx, i) => {
      if (typeSection === null)
        throw new Error("type section must not be null");
      if (codeSection === null)
        throw new Error("code section must not be null");
      const func = new WasmFunction(
        typeSection.funcTypes[typeIdx],
        codeSection.codes[i]
      );
      this.context.functions.push(func);
    });

    const exportSection = this.module.exportSection;
    exportSection?.exports.forEach((exp) => {
      if (exp.exportDesc?.tag === 0x00) {
        // funcidx
        this.exports[exp.name] = (...args: number[]) => {
          return this.context.functions[exp.exportDesc.index].invoke(
            this.context,
            ...args
          );
        };
      }
    });
  }
}

class LocalValue {
  constructor(private type: number, private value: number) {}

  store(buffer: Buffer) {
    switch (this.type) {
      case 0x7f: // i32
        buffer.writeI32(this.value);
        break;
      default:
        throw new Error(`invalid local type: ${this.type}`);
    }
  }

  load(buffer: Buffer) {
    switch (this.type) {
      case 0x7f:
        this.value = buffer.readI32();
        break;
      default:
        throw new Error(`invalid local type: ${this.type}`);
    }
  }
}

export class Context {
  public stack: Buffer;
  public functions: WasmFunction[];
  public locals: LocalValue[];

  constructor() {
    this.stack = new StackBuffer({ buffer: new ArrayBuffer(1024) });
    this.functions = [];
    this.locals = [];
  }
}

class WasmFunction {
  private instructions: InstructionSeq;

  constructor(private funcType: FuncTypeNode, private code: CodeNode) {
    this.instructions = new InstructionSeq(this.code.func?.expr?.instrs);
  }

  invoke(context: Context, ...args: number[]) {
    const params = [...args];
    const paramTypes = this.funcType.paramType.valTypes;

    // ここ何で引き算してるんだろう
    for (let i = 0; i < paramTypes.length - args.length; i++) {
      const param = context.stack.readI32();
      console.log({ param });
      params.push(param);
    }

    // 引数を設定
    params.forEach((v, i) => {
      context.locals[i] = new LocalValue(paramTypes[i], v);
    });

    // ローカル変数を設定
    const localses = this.code.func?.localses;
    if (localses) {
      for (let i = 0; i < localses.length; i++) {
        const locals = localses[i];
        for (let j = 0; j < locals.num; j++) {
          context.locals.push(new LocalValue(locals.valType, 0));
        }
      }
    }

    // コードを実行
    let instr = this.instructions.top;
    while (instr) {
      instr = instr.invoke(context);
    }

    const resultTypes = this.funcType.resultType.valTypes;
    if (resultTypes.length === 0) {
      return 0;
    } else {
      return context.stack.readI32();
    }
  }
}
