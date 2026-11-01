/* Compatibility entry point; implementation lives in packages/domain/src/templates.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/templates.js');
