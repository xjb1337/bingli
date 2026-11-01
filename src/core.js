/* Compatibility entry point; implementation lives in packages/domain/src/core.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/core.js');
