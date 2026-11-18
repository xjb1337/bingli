/** Subpath entry point `@dabingli/domain/templates` for on-demand template loading. */

import TEMPLATE_DATA from './template-data-module';
import {
  all,
  apply,
  deptName,
  DOCUMENT_TEMPLATES,
  findUnfilledPlaceholders,
  get,
  listByDept,
  outlineOf,
  previewPaths,
  SECTION_LABEL,
  SIDE_PLACEHOLDERS,
  TEMPLATES,
  unfilledPlaceholders
} from './templates';

export type {
  DocumentTemplateMap,
  DocumentTemplateMetadata,
  Template,
  TemplateApplyResult,
  TemplateOutlineItem,
  TemplatePlaceholder,
  TemplateSource
} from './types';

export {
  TEMPLATE_DATA,
  TEMPLATES,
  DOCUMENT_TEMPLATES,
  listByDept,
  get,
  all,
  apply,
  previewPaths,
  deptName,
  outlineOf,
  SECTION_LABEL,
  SIDE_PLACEHOLDERS,
  findUnfilledPlaceholders,
  unfilledPlaceholders
};

export default TEMPLATES;
