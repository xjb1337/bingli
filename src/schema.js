/* Compatibility entry point; implementation lives in packages/domain/src/schema.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/schema.js');
