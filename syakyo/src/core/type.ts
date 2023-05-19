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
  I32Const: 0x41,
  End: 0x0b,
} as const;

export type Op = (typeof Op)[keyof typeof Op];
