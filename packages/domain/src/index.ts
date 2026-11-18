import { AGE } from './age';
import { RECORD_CORE } from './core';
import { DEPTH } from './depth';
import { GENERATOR } from './generator';
import { DOCUMENT_IR } from './generator/document-ir';
import { DOCUMENT_TEMPLATES } from './generator/document-templates';
import { HINTS } from './hints';
import * as MIGRATIONS from './migrations/index';
import { DIAGNOSTICS } from './quality/diagnostics';
import { SCHEMA } from './schema';
import TEMPLATE_DATA from './template-data-module';
import { TEMPLATES } from './templates';

export const DOC_IR = DOCUMENT_IR;

export type { HintMatch, HintRule } from './hints';
export * from './types';

export {
  AGE,
  DEPTH,
  DIAGNOSTICS,
  DOCUMENT_IR,
  DOCUMENT_TEMPLATES,
  GENERATOR,
  HINTS,
  MIGRATIONS,
  RECORD_CORE,
  SCHEMA,
  TEMPLATE_DATA,
  TEMPLATES
};

export default {
  AGE,
  SCHEMA,
  RECORD_CORE,
  TEMPLATE_DATA,
  TEMPLATES,
  DEPTH,
  DIAGNOSTICS,
  DOCUMENT_TEMPLATES,
  GENERATOR,
  HINTS,
  DOC_IR,
  DOCUMENT_IR,
  MIGRATIONS
};
