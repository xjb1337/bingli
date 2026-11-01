# @dabingli/domain

Pure TypeScript domain modules for schema, migrations, templates, hints, depth
checks, and document generation. Runtime modules use the CommonJS-compatible
TypeScript subset so the Android single-file bundle retains the legacy behavior.
They do not access browser APIs. The legacy `src/*.js` paths re-export this
package for existing Android and test callers.
