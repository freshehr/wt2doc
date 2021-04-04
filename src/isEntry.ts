export function isEntry(rmType: string) {
  return ['OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY'].includes(rmType);
}
export function isSection(rmType: string) {
  return ['SECTION'].includes(rmType);
}

export function isDataValue(rmType: string) {
  return [
    'DV_CODED_TEXT',
    'DV_TEXT',
    'DV_DATE_TIME',
    'DV_ORDINAL',
    'DV_COUNT',
    'DV_DURATION',
    'DV_QUANTITY',
    'DV_DATE',
    'DV_BOOLEAN',
  ].includes(rmType);
}
