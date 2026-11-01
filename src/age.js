/* Compatibility entry point; implementation lives in packages/domain/src/age.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/age.js');
