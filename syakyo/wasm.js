// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Buffer {
    cursor = 0;
    view;
    buffer;
    constructor({ buffer  }){
        this.buffer = buffer;
        this.view = new DataView(buffer);
    }
    readBytes(size) {
        if (this.buffer.byteLength < this.cursor + size) {
            return new Uint8Array(0);
        }
        const slice = this.buffer.slice(this.cursor, this.cursor + size);
        this.cursor += size;
        return new Uint8Array(slice);
    }
    writeBytes(bytes) {
        const u8s = new Uint8Array(bytes);
        for (const __byte of u8s){
            this.writeByte(__byte);
        }
    }
    readByte() {
        const bytes = this.readBytes(1);
        if (bytes.length <= 0) {
            return -1;
        }
        return bytes[0];
    }
    writeByte(__byte) {
        this.view.setUint8(this.cursor++, __byte);
    }
    readU32() {
        let result = 0;
        let shift = 0;
        while(true){
            const __byte = this.readByte();
            result |= (__byte & 0b1111111) << shift;
            shift += 7;
            if ((0b10000000 & __byte) === 0) {
                return result;
            }
        }
    }
    writeU32(value) {
        value |= 0;
        const result = [];
        while(true){
            const __byte = value & 0b01111111;
            value >>= 7;
            if (value === 0 && (__byte & 0b01000000) === 0) {
                result.push(__byte);
                break;
            }
            result.push(__byte | 0b10000000);
        }
        const u8a = new Uint8Array(result);
        this.writeBytes(u8a.buffer);
    }
    readS32() {
        let result = 0;
        let shift = 0;
        while(true){
            const __byte = this.readByte();
            if (__byte < 0) throw new Error("fail to read buffer");
            result |= (__byte & 0b01111111) << shift;
            shift += 7;
            if ((0b10000000 & __byte) === 0) {
                if (shift < 32 && (__byte & 0b01000000) !== 0) {
                    return result | ~0 << shift;
                }
                return result;
            }
        }
    }
    writeS32(value) {
        value |= 0;
        const result = [];
        while(true){
            const __byte = value & 0b01111111;
            value >>= 7;
            if (value === 0 && (__byte & 0b01000000) === 0 || value === -1 && (__byte & 0b01000000) !== 0) {
                result.push(__byte);
                break;
            }
            result.push(__byte | 0b10000000);
        }
        const u8a = new Uint8Array(result);
        this.writeBytes(u8a.buffer);
    }
    readI32() {
        return this.readU32();
    }
    writeI32(num) {
        this.writeS32(num);
    }
    readBuffer(size = this.buffer.byteLength - this.cursor) {
        return new Buffer(this.readBytes(size));
    }
    readVec(readT) {
        const vec = [];
        const size = this.readU32();
        for(let i = 0; i < size; i++){
            vec.push(readT());
        }
        return vec;
    }
    writeVec(ts, writeT) {
        this.writeU32(ts.length);
        for (const t of ts){
            writeT(t);
        }
    }
    readName() {
        const size = this.readU32();
        const bytes = this.readBytes(size);
        return new TextDecoder("utf-8").decode(bytes.buffer);
    }
    writeName(name) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(name);
        this.writeU32(bytes.length);
        this.writeBytes(bytes);
    }
    peek(pos = 0) {
        return this.view.getUint8(pos);
    }
    append(buffer) {
        this.writeU32(buffer.cursor);
        for(let i = 0; i < buffer.cursor; i++){
            this.writeByte(buffer.peek(i));
        }
    }
    get byteLength() {
        return this.buffer.byteLength;
    }
    get eof() {
        return this.byteLength <= this.cursor;
    }
}
class StackBuffer extends Buffer {
    readBytes(size) {
        if (this.cursor - size < 0) {
            return new Uint8Array(0);
        }
        const slice = this.buffer.slice(this.cursor - size, this.cursor);
        this.cursor = this.cursor - size;
        return new Uint8Array(slice).reverse();
    }
    writeBytes(bytes) {
        const u8s = new Uint8Array(bytes).reverse();
        for (const __byte of u8s){
            this.writeByte(__byte);
        }
    }
}
const Op = {
    Block: 0x02,
    Loop: 0x03,
    If: 0x04,
    Else: 0x05,
    Br: 0x0c,
    BrIf: 0x0d,
    Call: 0x10,
    LocalGet: 0x20,
    LocalSet: 0x21,
    I32Const: 0x41,
    I32Eqz: 0x45,
    I32LtS: 0x48,
    I32GeS: 0x4e,
    I32Add: 0x6a,
    I32RemS: 0x6f,
    End: 0x0b
};
class InstrNode {
    opcode;
    static create(opcode) {
        switch(opcode){
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
    constructor(opcode){
        this.opcode = opcode;
    }
    load(buffer) {}
    store(buffer) {
        buffer.writeByte(this.opcode);
    }
}
class I32ConstInstrNode extends InstrNode {
    num;
    load(buffer) {
        this.num = buffer.readI32();
    }
    store(buffer) {
        super.store(buffer);
        buffer.writeI32(this.num);
    }
}
class I32AddInstrNode extends InstrNode {
}
class I32EqzInstrNode extends InstrNode {
}
class I32LtSInstrNode extends InstrNode {
}
class I32GeSInstrNode extends InstrNode {
}
class I32RemSInstrNode extends InstrNode {
}
class LocalGetInstrNode extends InstrNode {
    localIdx;
    load(buffer) {
        this.localIdx = buffer.readU32();
    }
}
class LocalSetInstrNode extends InstrNode {
    localIdx;
    load(buffer) {
        this.localIdx = buffer.readU32();
    }
}
class ExprNode {
    instrs = [];
    endOp;
    load(buffer) {
        while(true){
            const opcode = buffer.readByte();
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
    store(buffer) {
        for (const instr of this.instrs){
            instr.store(buffer);
        }
        buffer.writeByte(this.endOp);
    }
}
class IfInstrNode extends InstrNode {
    blockType;
    thenInstrs;
    elseInstrs;
    load(buffer) {
        this.blockType = buffer.readByte();
        this.thenInstrs = new ExprNode();
        this.thenInstrs.load(buffer);
        if (this.thenInstrs.endOp === Op.Else) {
            this.elseInstrs = new ExprNode();
            this.elseInstrs.load(buffer);
        }
    }
}
class BlockInstrNode extends InstrNode {
    blockType;
    instrs;
    load(buffer) {
        this.blockType = buffer.readByte();
        this.instrs = new ExprNode();
        this.instrs.load(buffer);
    }
}
class LoopInstrNode extends InstrNode {
    blockType;
    instrs;
    load(buffer) {
        this.blockType = buffer.readByte();
        this.instrs = new ExprNode();
        this.instrs.load(buffer);
    }
}
class BrInstrNode extends InstrNode {
    labelIdx;
    load(buffer) {
        this.labelIdx = buffer.readU32();
    }
}
class BrIfInstrNode extends InstrNode {
    labelIdx;
    load(buffer) {
        this.labelIdx = buffer.readU32();
    }
}
class CallInstrNode extends InstrNode {
    funcIdx;
    load(buffer) {
        this.funcIdx = buffer.readU32();
    }
}
class Instruction {
    parent;
    #next;
    constructor(parent){
        this.parent = parent;
    }
    get next() {
        if (this.#next) {
            return this.#next;
        } else {
            return this.parent?.next;
        }
    }
    set next(instr) {
        this.#next = instr;
    }
    static create(node, parent) {
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
    invoke(context) {
        throw new Error(`subclass responsibility: ${this.constructor.name}`);
    }
}
class InstructionSeq extends Instruction {
    #instructions = [];
    constructor(nodes = [], parent){
        super();
        if (nodes.length === 0) return;
        let prev = Instruction.create(nodes[0], parent);
        this.#instructions.push(prev);
        for(let i = 1; i < nodes.length; i++){
            prev.next = Instruction.create(nodes[i], parent);
            this.#instructions.push(prev);
            prev = prev.next;
        }
    }
    get top() {
        return this.#instructions[0];
    }
    invoke(context) {
        return this.top;
    }
}
class LocalGetInstruction extends Instruction {
    localIdx;
    constructor(node, parent){
        super(parent);
        this.localIdx = node.localIdx;
    }
    invoke(context) {
        const local = context.locals[this.localIdx];
        local.store(context.stack);
        return this.next;
    }
}
class LocalSetInstruction extends Instruction {
    localIdx;
    constructor(node, parent){
        super(parent);
        this.localIdx = node.localIdx;
    }
    invoke(context) {
        const local = context.locals[this.localIdx];
        local.load(context.stack);
        return this.next;
    }
}
class I32ConstInstruction extends Instruction {
    num;
    constructor(node, parent){
        super(parent);
        this.num = node.num;
    }
    invoke(context) {
        context.stack.writeI32(this.num);
        return this.next;
    }
}
class I32AddInstruction extends Instruction {
    constructor(node, parent){
        super(parent);
    }
    invoke(context) {
        const rhs = context.stack.readI32();
        const lhs = context.stack.readI32();
        context.stack.writeI32(lhs + rhs);
        return this.next;
    }
}
class I32RemSInstruction extends Instruction {
    constructor(node, parent){
        super(parent);
    }
    invoke(context) {
        const rhs = context.stack.readS32();
        const lhs = context.stack.readS32();
        context.stack.writeS32(lhs % rhs);
        return this.next;
    }
}
class I32EqzInstruction extends Instruction {
    constructor(node, parent){
        super(parent);
    }
    invoke(context) {
        const num = context.stack.readS32();
        context.stack.writeI32(num === 0 ? 1 : 0);
        return this.next;
    }
}
class I32LtSInstruction extends Instruction {
    constructor(node, parent){
        super(parent);
    }
    invoke(context) {
        const rhs = context.stack.readS32();
        const lhs = context.stack.readS32();
        context.stack.writeI32(lhs < rhs ? 1 : 0);
        return this.next;
    }
}
class I32GeSInstruction extends Instruction {
    constructor(node, parent){
        super(parent);
    }
    invoke(context) {
        const rhs = context.stack.readS32();
        const lhs = context.stack.readS32();
        context.stack.writeI32(lhs >= rhs ? 1 : 0);
        return this.next;
    }
}
class Instance {
    context;
    constructor(module, exports = {}){
        this.module = module;
        this.exports = exports;
        this.context = new Context();
    }
    compile() {
        const typeSection = this.module.typeSection;
        const codeSection = this.module.codeSection;
        const functionSection = this.module.functionSection;
        functionSection?.typeIndexes.forEach((typeIdx, i)=>{
            if (typeSection === null) throw new Error("type section must not be null");
            if (codeSection === null) throw new Error("code section must not be null");
            const func = new WasmFunction(typeSection.funcTypes[typeIdx], codeSection.codes[i]);
            this.context.functions.push(func);
        });
        const exportSection = this.module.exportSection;
        exportSection?.exports.forEach((exp)=>{
            if (exp.exportDesc?.tag === 0x00) {
                this.exports[exp.name] = (...args)=>{
                    return this.context.functions[exp.exportDesc.index].invoke(this.context, ...args);
                };
            }
        });
    }
    module;
    exports;
}
class LocalValue {
    constructor(type, value){
        this.type = type;
        this.value = value;
    }
    store(buffer) {
        switch(this.type){
            case 0x7f:
                buffer.writeI32(this.value);
                break;
            default:
                throw new Error(`invalid local type: ${this.type}`);
        }
    }
    load(buffer) {
        switch(this.type){
            case 0x7f:
                this.value = buffer.readI32();
                break;
            default:
                throw new Error(`invalid local type: ${this.type}`);
        }
    }
    type;
    value;
}
class Context {
    stack;
    functions;
    locals;
    constructor(){
        this.stack = new StackBuffer({
            buffer: new ArrayBuffer(1024)
        });
        this.functions = [];
        this.locals = [];
    }
}
class WasmFunction {
    instructions;
    constructor(funcType, code){
        this.funcType = funcType;
        this.code = code;
        this.instructions = new InstructionSeq(this.code.func?.expr?.instrs);
    }
    invoke(context, ...args) {
        const params = [
            ...args
        ];
        const paramTypes = this.funcType.paramType.valTypes;
        for(let i = 0; i < paramTypes.length - args.length; i++){
            const param = context.stack.readI32();
            params.push(param);
        }
        params.forEach((v, i)=>{
            context.locals[i] = new LocalValue(paramTypes[i], v);
        });
        const localses = this.code.func?.localses;
        if (localses) {
            for(let i1 = 0; i1 < localses.length; i1++){
                const locals = localses[i1];
                for(let j = 0; j < locals.num; j++){
                    context.locals.push(new LocalValue(locals.valType, 0));
                }
            }
        }
        let instr = this.instructions.top;
        while(instr){
            instr = instr.invoke(context);
        }
        const resultTypes = this.funcType.resultType.valTypes;
        if (resultTypes.length === 0) {
            return 0;
        } else {
            return context.stack.readI32();
        }
    }
    funcType;
    code;
}
class SectionNode {
    static create(sectionId) {
        switch(sectionId){
            case 1:
                return new TypeSectionNode();
            case 3:
                return new FunctionSectionNode();
            case 7:
                return new ExportSectionNode();
            case 10:
                return new CodeSectionNode();
            default:
                throw new Error(`invalid section id: ${sectionId}`);
        }
    }
}
class ResultTypeNode {
    valTypes = [];
    load(buffer) {
        this.valTypes = buffer.readVec(()=>{
            return buffer.readByte();
        });
    }
    store(buffer) {
        buffer.writeVec(this.valTypes, (valType)=>buffer.writeByte(valType));
    }
}
class FuncTypeNode {
    static TAG = 0x60;
    paramType = new ResultTypeNode();
    resultType = new ResultTypeNode();
    load(buffer) {
        if (buffer.readByte() !== FuncTypeNode.TAG) {
            throw new Error("invalid functype");
        }
        this.paramType = new ResultTypeNode();
        this.paramType.load(buffer);
        this.resultType = new ResultTypeNode();
        this.resultType.load(buffer);
    }
    store(buffer) {
        buffer.writeByte(FuncTypeNode.TAG);
        this.paramType.store(buffer);
        this.resultType.store(buffer);
    }
}
class TypeSectionNode extends SectionNode {
    funcTypes = [];
    load(buffer) {
        this.funcTypes = buffer.readVec(()=>{
            const funcType = new FuncTypeNode();
            funcType.load(buffer);
            return funcType;
        });
    }
    store(buffer) {
        buffer.writeByte(1);
        const sectionsBuffer = new Buffer({
            buffer: new ArrayBuffer(1024)
        });
        sectionsBuffer.writeVec(this.funcTypes, (funcType)=>funcType.store(sectionsBuffer));
        buffer.append(sectionsBuffer);
    }
}
class FunctionSectionNode extends SectionNode {
    typeIndexes = [];
    load(buffer) {
        this.typeIndexes = buffer.readVec(()=>{
            return buffer.readU32();
        });
    }
    store(buffer) {
        buffer.writeByte(3);
        const sectionsBuffer = new Buffer({
            buffer: new ArrayBuffer(1024)
        });
        sectionsBuffer.writeVec(this.typeIndexes, (typeIdx)=>sectionsBuffer.writeU32(typeIdx));
        buffer.append(sectionsBuffer);
    }
}
class LocalsNode {
    num;
    valType;
    load(buffer) {
        this.num = buffer.readU32();
        this.valType = buffer.readByte();
    }
    store(buffer) {
        buffer.writeU32(this.num);
        buffer.writeByte(this.valType);
    }
}
class FuncNode {
    localses = [];
    expr;
    load(buffer) {
        this.localses = buffer.readVec(()=>{
            const locals = new LocalsNode();
            locals.load(buffer);
            return locals;
        });
        this.expr = new ExprNode();
        this.expr.load(buffer);
    }
    store(buffer) {
        buffer.writeVec(this.localses, (locals)=>locals.store(buffer));
        this.expr?.store(buffer);
    }
}
class CodeNode {
    size;
    func;
    load(buffer) {
        this.size = buffer.readU32();
        const funcBuffer = buffer.readBuffer(this.size);
        this.func = new FuncNode();
        this.func.load(funcBuffer);
    }
    store(buffer) {
        const funcBuffer = new Buffer({
            buffer: new ArrayBuffer(1024)
        });
        this.func?.store(funcBuffer);
        buffer.append(funcBuffer);
    }
}
class CodeSectionNode extends SectionNode {
    codes = [];
    load(buffer) {
        this.codes = buffer.readVec(()=>{
            const code = new CodeNode();
            code.load(buffer);
            return code;
        });
    }
    store(buffer) {
        buffer.writeByte(10);
        const sectionsBuffer = new Buffer({
            buffer: new ArrayBuffer(1024)
        });
        sectionsBuffer.writeVec(this.codes, (code)=>code.store(sectionsBuffer));
        buffer.append(sectionsBuffer);
    }
}
class ExportDescNode {
    tag;
    index;
    load(buffer) {
        this.tag = buffer.readByte();
        this.index = buffer.readU32();
    }
    store(buffer) {
        buffer.writeByte(this.tag);
        buffer.writeU32(this.index);
    }
}
class ExportNode {
    name;
    exportDesc;
    load(buffer) {
        this.name = buffer.readName();
        this.exportDesc = new ExportDescNode();
        this.exportDesc.load(buffer);
    }
    store(buffer) {
        buffer.writeName(this.name);
        this.exportDesc.store(buffer);
    }
}
class ExportSectionNode extends SectionNode {
    exports = [];
    load(buffer) {
        this.exports = buffer.readVec(()=>{
            const ex = new ExportNode();
            ex.load(buffer);
            return ex;
        });
    }
    store(buffer) {
        buffer.writeByte(7);
        const sectionsBuffer = new Buffer({
            buffer: new ArrayBuffer(1024)
        });
        sectionsBuffer.writeVec(this.exports, (ex)=>ex.store(sectionsBuffer));
    }
}
class ModuleNode {
    magic;
    version;
    sections = [];
    load(buffer) {
        this.magic = buffer.readBytes(4);
        this.version = buffer.readBytes(4);
        while(true){
            if (buffer.eof) break;
            const section = this.loadSection(buffer);
            this.sections.push(section);
        }
    }
    loadSection(buffer) {
        const sectionId = buffer.readByte();
        const sectionSize = buffer.readU32();
        const sectionsBuffer = buffer.readBuffer(sectionSize);
        const section = SectionNode.create(sectionId);
        section.load(sectionsBuffer);
        return section;
    }
    store(buffer) {
        if (this.magic) buffer.writeBytes(this.magic);
        if (this.version) buffer.writeBytes(this.version);
        for (const section of this.sections){
            section.store(buffer);
        }
    }
    instantiate() {
        const inst = new Instance(this);
        inst.compile();
        return inst;
    }
    getSection(cls) {
        for (const section of this.sections){
            if (section instanceof cls) {
                return section;
            }
        }
        return null;
    }
    get typeSection() {
        return this.getSection(TypeSectionNode);
    }
    get functionSection() {
        return this.getSection(FunctionSectionNode);
    }
    get exportSection() {
        return this.getSection(ExportSectionNode);
    }
    get codeSection() {
        return this.getSection(CodeSectionNode);
    }
}
export { ModuleNode as WasmModule };
export { Buffer as WasmBuffer };
