/* Compatibility entry point; implementation lives in packages/domain/src/hints.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/hints.js');
