import { Buffer } from "./buffer.ts";
import { Instance } from "./instance.ts";
import {
  CodeSectionNode,
  ExportSectionNode,
  FunctionSectionNode,
  SectionNode,
  TypeSectionNode,
} from "./section.ts";

export class ModuleNode {
  magic?: Uint8Array;
  version?: Uint8Array;
  sections: SectionNode[] = [];

  load(buffer: Buffer) {
    this.magic = buffer.readBytes(4);
    this.version = buffer.readBytes(4);

    while (true) {
      if (buffer.eof) break;

      const section = this.loadSection(buffer);
      this.sections.push(section);
    }
  }

  loadSection(buffer: Buffer): SectionNode {
    const sectionId = buffer.readByte();
    const sectionSize = buffer.readU32();
    const sectionsBuffer = buffer.readBuffer(sectionSize);

    const section = SectionNode.create(sectionId);
    section.load(sectionsBuffer);

    return section;
  }

  store(buffer: Buffer) {
    if (this.magic) buffer.writeBytes(this.magic);
    if (this.version) buffer.writeBytes(this.version);

    for (const section of this.sections) {
      section.store(buffer);
    }
  }

  instantiate(): Instance {
    console.log("instantiate");
    const inst = new Instance(this);
    inst.compile();
    return inst;
  }

  // deno-lint-ignore ban-types
  getSection<S extends SectionNode>(cls: Function): S | null {
    for (const section of this.sections) {
      if (section instanceof cls) {
        return section as S;
      }
    }
    return null;
  }

  get typeSection(): TypeSectionNode | null {
    return this.getSection<TypeSectionNode>(TypeSectionNode);
  }

  get functionSection(): FunctionSectionNode | null {
    return this.getSection<FunctionSectionNode>(FunctionSectionNode);
  }

  get exportSection(): ExportSectionNode | null {
    return this.getSection<ExportSectionNode>(ExportSectionNode);
  }

  get codeSection(): CodeSectionNode | null {
    return this.getSection<CodeSectionNode>(CodeSectionNode);
  }
}
