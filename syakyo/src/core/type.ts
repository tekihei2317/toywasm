type I32 = 0x7f;
type I64 = 0x73;
type F32 = 0x7d;
type F64 = 0x7c;
type NumType = I32 | I64 | F32 | F64;
type FuncRef = 0x70;
type ExternRef = 0x6f;
type RefType = FuncRef | ExternRef;
// VecTypeが追加されてそう
export type ValType = NumType | RefType;

export const Op = {
  LocalGet: 0x20,
  LocalSet: 0x21,
  I32Const: 0x41,
  I32Eqz: 0x45,
  I32LtS: 0x48,
  I32GeS: 0x4e,
  I32Add: 0x6a,
  I32RemS: 0x6f,
  End: 0x0b,
} as const;

export type Op = (typeof Op)[keyof typeof Op];
