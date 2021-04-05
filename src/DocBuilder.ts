import { FormElement } from './FormElement';
import { WebTemplate } from './WebTemplate';
import { isEntry, isDataValue, isSection } from './isEntry';
import { StringBuilder } from './StringBuilder';
import { FormInput } from './FormInput';
import { FormList } from './FormList';

export class DocBuilder {
  sb: StringBuilder = new StringBuilder();
  defaultLang: string = 'en';

  constructor(private wt: WebTemplate) {
    this.defaultLang = wt.defaultLanguage;
    this.generate();
  }
  public toString(): string {
    return this.sb.toString();
  }

  private generate() {

    const f = this.wt.tree;

    this.sb.append(`= ${this.wt.templateId}`).newline();
    this.sb.append(`== *${f.name}*`).newline()
    this.sb.append(`=== \`${f.rmType}: _${f.nodeId}_\``).newline();

    this.walk(this.wt.tree);
  }


  private walkChildren(f: FormElement) {
    if (f.children) {
      f.children.forEach((child) => {
        this.walk(child);
      });
    }
  }

  private walkNonContextChildren(f: FormElement) {
    if (f.children) {
      f.children.forEach((child) => {
        if (!child.inContext) {this.walk(child)}
      });
    }
  }

  private walk(f: FormElement) {
    if (f.aqlPath === '/category') {
      this.walkChildren(f);
    } else if (isEntry(f.rmType)) {
      this.walkEntry(f);
    } else if (isDataValue(f.rmType)) {
      this.walkElement(f);
    } else if (isSection(f.rmType)) {
      this.walkSection(f);
    } else if (f.rmType === 'CLUSTER') {
      this.sb.append(`5+a|*${f.name}* +\n \`${f.rmType}: _${f.nodeId}_\``);
      this.walkChildren(f);
    } else {
      switch (f.rmType) {
        case 'COMPOSITION':
          this.walkRmAttributes(f)
          this.walkNonContextChildren(f);
          break;
        case 'ISM_TRANSITION':
          this.walkChildren(f);
          break;
        case 'EVENT_CONTEXT':
          f.name = 'context';
          this.walkEntry(f);
          break;
        case 'CODE_PHRASE':
          f.name = f.id;
          this.walkElement(f);
          break;
        case 'PARTY_PROXY':
          f.name = f.id;
          this.walkElement(f);
          break;

        default:
          this.sb.append('// Not supported rmType ' + f.rmType);

   //       this.walkChildren(f);
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


    const nodeId = f.nodeId?f.nodeId:`\`RM:${f.id}\``

    this.sb.append(`=== ${f.name}`);
    this.sb.append(`===== \`${f.rmType}: _${nodeId}_\``);

    this.walkRmAttributes(f);

    if (f.children) {

      this.sb.append('[options="header", cols="5,3,5,5,30"]');
      this.sb.append('|====');
      this.sb.append('|NodeId|Attr.|RM Type| Name | Description');

      f.children.forEach((child) => {
        if (!child.inContext) {
          this.walk(child)
        }
      });

      this.sb.append('|====');

    }



  }

  private walkRmAttributes(f: FormElement) {

    const rmAttributes = new Array <FormElement>();

    if (f.children) {

      f.children.forEach((child) => {
        if (child.inContext !== undefined && child.inContext) {
          rmAttributes.push(child);
        }
      });

    }

    if (rmAttributes.length > 0) {
      this.sb.append(`===== RM attributes`);
      this.sb.append('[options="header", cols="5,3,5,5,30"]');
      this.sb.append('|====');
      this.sb.append('|NodeId|Attr.|RM Type| Name | Description');

      rmAttributes.forEach((child) => {
        this.walk(child);
      });
      this.sb.append('|====');
    }

    this.walkParticipations(true);

  }

  private walkParticipations(displayParticipations : boolean) {

    if (displayParticipations) {
      this.sb.append(`===== _Participations_ [0..*]`);
      this.sb.append('[options="header", cols="5,3,5,5,30"]');
      this.sb.append('|====');
      this.sb.append('|NodeId|Attr.|RM Type| Name | Description');
      this.sb.append('|RM: function|1..1|DV_TEXT| Role | The function of the Party in this participation');
//      this.sb.append('|RM: mode|0..1|DV_CODED_TEXT| Mode | Optional field for recording the \'mode\' of the performer / activity interaction, e.g. present, by telephone, by email etc.');
      this.sb.append('|RM: performer|1..1|PARTY_IDENTIFIED| Performer name and ID | The id and possibly demographic system link of the party participating in the activity.');
//      this.sb.append('|RM: time|0..1|DV_INTERVAL| Time | The time interval during which the participation took place, ');
      this.sb.append('|====');
    }
  }

  private walkElement(f: FormElement) {
    const max = f.max < 0 ? '*' : `${f.max}`;

    const nodeId = f.nodeId?f.nodeId:`RM:`;
    this.sb.append(`|${nodeId} + \n \`${f.id}\`| ${f.min}..${max}| ${f.rmType} | ${f.name}`);

    if (f.name === undefined){this.sb.append(`// ${f.id} -  ${f.aqlPath}`);}

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
        break;
      case 'CODE_PHRASE':
        this.walkCodePhrase(f);
        break;
        case 'PARTY_PROXY':
        this.walkPartyProxy(f);
        break;

      default:
        this.sb.append('|Not supported rm type: ' + f.rmType);
    }

    if (f.annotations) {
      this.sb.newline().append(`Comment: ${f.annotations.comment}`);
    }

  }

  private walkDvBoolean(f: FormElement) {
    this.sb.append('|');
  }

  private walkCodePhrase(f: FormElement) {
    this.sb.append('|');
  }

  private walkPartyProxy(f: FormElement) {
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
        if (item.listOpen)
          this.sb.append( `* _Other text allowed_`);

      });
      this.sb.newline().append(`${this.getValueOfRecord(f.localizedDescriptions)}`);
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
          if (item.listOpen)
            this.sb.append( `* _Other text allowed_`);
          this.sb.newline().append(`${this.getValueOfRecord(f.localizedDescriptions)}`);
        }
      });
    }
  }
}
