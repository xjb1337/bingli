/* Compatibility entry point; implementation lives in packages/domain/src/generator.ts. */
if (typeof module !== 'undefined') module['exports'] = require('../packages/domain/dist/generator.js');
