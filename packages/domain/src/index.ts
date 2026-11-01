/* Public domain entry point. All exports are pure data/functions and have no DOM dependency. */
const root = typeof globalThis !== 'undefined' ? globalThis : {};
const AGE = require('./age.js');
root.AGE = AGE;
const SCHEMA = require('./schema.js');
root.SCHEMA = SCHEMA;
const RECORD_CORE = require('./core.js');
root.RECORD_CORE = RECORD_CORE;
const TEMPLATE_DATA = require('./template-data.js');
root.TEMPLATE_DATA = TEMPLATE_DATA;
const TEMPLATES = require('./templates.js');
root.TEMPLATES = TEMPLATES;
const DEPTH = require('./depth.js');
root.DEPTH = DEPTH;
const DIAGNOSTICS = require('./quality/diagnostics.js');
root.DIAGNOSTICS = DIAGNOSTICS;
const GENERATOR = require('./generator.js');
root.GENERATOR = GENERATOR;
const HINTS = require('./hints.js');
root.HINTS = HINTS;
const DOC_IR = require('./generator/document-ir.js');
const MIGRATIONS = require('./migrations/index.js');
module.exports = {
  AGE, SCHEMA, RECORD_CORE, TEMPLATE_DATA, TEMPLATES, DEPTH, DIAGNOSTICS,
  GENERATOR, HINTS, DOC_IR, DOCUMENT_IR: DOC_IR, MIGRATIONS
};
