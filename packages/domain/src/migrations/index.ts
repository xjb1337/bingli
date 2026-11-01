/** Pure adapters for the v1/v2/v3 legacy record and backup formats. */
const SCHEMA = require('../schema.js');
const CORE = require('../core.js');

function deptKeys() {
  return (SCHEMA.DEPARTMENTS || []).map((d) => d.key);
}

function migrateRecord(raw, options = {}) {
  const empty = options.emptyRecord || SCHEMA.emptyRecord;
  const valid = options.validDeptKeys || deptKeys();
  return CORE.normalizeRecord(raw, empty, valid);
}

function parseImport(rawText, options = {}) {
  const empty = options.emptyRecord || SCHEMA.emptyRecord;
  const valid = options.validDeptKeys || deptKeys();
  return CORE.parseImport(rawText, empty, valid);
}

function buildExport(records, isoNow, options = {}) {
  return CORE.buildExport(records, isoNow, options);
}

module.exports = { migrateRecord, parseImport, buildExport, SCHEMA_VERSION: CORE.SCHEMA_VERSION };
