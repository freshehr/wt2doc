import { FormElement } from './FormElement';
import { WebTemplate } from './WebTemplate';
import { isEntry, isDataValue, isSection } from './isEntry';
import { StringBuilder } from './StringBuilder';
import { FormInput } from './FormInput';
import { FormList } from './FormList';

export class DocBuilder {
  sb: StringBuilder = new StringBuilder();
  defaultLang: string = 'nb';

  constructor(private wt: WebTemplate) {
    this.defaultLang = wt.defaultLanguage;
    this.generate();
  }
  public toString(): string {
    return this.sb.toString();
  }

  private generate() {
    // this.sb.append(`= ${this.wt.templateId}`);
    const f = this.wt.tree;

    this.sb.append(`= ${f.name}`).newline();
    this.sb.append(`== Metadata`).newline();
    this.sb.append(`TemplateId:: ${this.wt.templateId}`).newline();
    this.sb.append(`Archetype:: ${f.nodeId}`).newline();
    this.sb.newline();
    this.walk(this.wt.tree);
  }
  private walkChildren(f: FormElement) {
    if (f.children) {
      f.children.forEach((child) => {
        this.walk(child);
      });
    }
  }
  private walk(f: FormElement) {
    if (f.aqlPath === '/category') {
      // skipping category
    } else if (isEntry(f.rmType)) {
      this.walkEntry(f);
    } else if (isDataValue(f.rmType)) {
      this.walkElement(f);
    } else if (isSection(f.rmType)) {
      this.walkSection(f);
    } else if (f.rmType === 'CLUSTER') {
      this.sb.append(`5+a|*${f.name}* + \n${f.rmType}: _${f.nodeId}_`);
      this.walkChildren(f);
    } else {
      switch (f.rmType) {
        case 'COMPOSITIION':
          this.walkChildren(f);
          break;
        case 'ISM_TRANSITION':
          break;
        case 'EVENT_CONTEXT':
          f.name = 'EVENT_CONTEXT';
          this.walkEntry(f);
          break;
        case 'CODE_PHRASE':
          f.name = 'CODE_PHRASE';
          this.walkCodePhrase(f);
          break;

        default:
          this.sb.append('// Not supported rmType ' + f.rmType);
          this.walkChildren(f);
          break;
      }
    }
  }
  private walkSection(f: FormElement) {
    this.sb.append(`== ${f.name}`);
    if (f.children) {
      f.children.forEach((child) => {
        this.walk(child);
      });
    }
  }
  private walkEntry(f: FormElement) {
    this.sb.append(`== ${f.name}`);
    this.sb.append('[options="header", cols="3,3,5,5,30"]');
    this.sb.append('|====');
    this.sb.append('|NodeId|Attr.|RM Type| Navn |Beskrivelse');
    this.sb.append(`5+a|*${f.name}* + \n${f.rmType}: _${f.nodeId}_`);
    if (f.children) {
      f.children.forEach((child) => {
        if (child.inContext !== undefined && child.inContext) {
          // Will not document things in contexts (which is included in openEHR RM)
        } else {
          this.walk(child);
        }
      });
      this.sb.append('|====');
    }
  }
  private walkElement(f: FormElement) {
    const max = f.max < 0 ? '*' : `${f.max}`;
    this.sb.append(`|${f.nodeId}| ${f.min}..${max}| ${f.rmType} | ${f.name}`);

    if (f.name === undefined) this.sb.append(`// ${f.id} -  ${f.aqlPath}`);

    switch (f.rmType) {
      case 'DV_CODED_TEXT':
        this.walkDvCodedText(f);

        break;
      case 'DV_TEXT':
        this.walkDvText(f);
        break;
      case 'DV_DATE':
        this.walkDvDateTime(f);
        break;
      case 'DV_DATE_TIME':
        this.walkDvDateTime(f);
        break;
      case 'DV_QUANTITY':
        this.walkDvQuantity(f);
        break;
      case 'DV_ORDINAL':
        this.walkDvOrdinal(f);
        break;
      case 'DV_COUNT':
        this.walkDvCount(f);
        break;
      case 'DV_DURATION':
        this.walkDvDuration(f);
        break;
      case 'DV_BOOLEAN':
        this.walkDvBoolean(f);
        break;
      case 'DV_IDENTIFIER':
        this.walkDvIdentifier(f);
        break;
      default:
        this.sb.append('|Not supported rm type' + f.rmType);
    }

    if (f.annotations) {
      this.sb.newline();
      this.sb.append(f.annotations.comment);
    }
    // this.sb.append(`${this.getValueOfRecord(f.localizedDescriptions)}`);
  }

  private walkDvBoolean(f: FormElement) {
    this.sb.append('|');
  }

  private walkCodePhrase(f: FormElement) {
    this.sb.append('|');
  }

  private walkDvIdentifier(f: FormElement) {
    this.sb.append('|');
  }
  private walkDvDuration(f: FormElement) {
    this.sb.append('|');
  }

  private walkDvCount(f: FormElement) {
    this.sb.append('|');
  }
  private walkDvOrdinal(f: FormElement) {
    this.sb.append('a|');
    if (f.inputs) {
      const fi: FormInput[] = f.inputs;
      // const term = fi.terminology == undefined ? "local" : fi.terminology;
      fi.forEach((item) => {
        const formItems = item.list === undefined ? [] : item.list;
        formItems.forEach((n) => {
          this.sb.append(`* ${n.ordinal} - ${n.label} ${this.getValueOfRecord(n.localizedDescriptions)}`);
        });
      });
    }
  }
  private getValueOfRecord(record?: Record<string, string>): string {
    if (record) {
      return record[this.defaultLang];
    } else {
      return '';
    }
  }
  private walkDvQuantity(f: FormElement) {
    this.sb.append('|');
  }
  private walkDvText(f: FormElement) {
    this.sb.append('a|');
    if (f.inputs) {
      f.inputs.forEach((item) => {
        if (item.list) {
          item.list.forEach((val) => {
            this.sb.append(`* ${val.value}`);
          });
        }
      });
    }
  }
  private walkDvDateTime(f: FormElement) {
    this.sb.append('|');
  }
  private walkDvCodedText(f: FormElement) {
    this.sb.append('a|');
    if (f.inputs) {
      f.inputs.forEach((item) => {
        const term = item.terminology === undefined ? 'local' : item.terminology;
        if (item.list) {
          item.list.forEach((list) => {
            if (term === 'local') {
              this.sb.append(`* ${list.value} -> ${list.label} `);
            } else {
              this.sb.append(`* ${list.label} (${term}: ${list.value})`);
            }
          });
        }
      });
    }
  }
}
