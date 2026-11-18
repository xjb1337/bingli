/* ===========================================================================
 * 大病历生成器 —— 数据模型 / 字段定义（聚合入口）
 * =========================================================================== */

import {
  ALLERGENS,
  ALLERGY_REACTIONS,
  COMMON_PMH,
  DEPARTMENTS,
  DURATION_UNITS,
  FAMILY_DISEASES,
  GENDERS,
  MARITAL,
  NATIONALITY,
  OCCUPATIONS,
  RELIABILITY,
  VITALS
} from './schema/constants';
import {
  childPEItems,
  FACT_STATES,
  findPEItem,
  inferPeFactState,
  normalizeFactState,
  parentSupersededByChild,
  PE_INDEX,
  peChecked,
  peFactState,
  peItemFilled,
  peNormalText,
  peValueIsDefault,
  rosFactState,
  setPeChecked,
  setPeFactState
} from './schema/fact-state';
import { PE_COMMON } from './schema/pe-common';
import { PE_SPECIAL } from './schema/pe-special';
import { emptyDocMeta, emptyRecord, todayStr } from './schema/record-factory';
import { ROS } from './schema/ros';

export {
  ALLERGENS,
  ALLERGY_REACTIONS,
  COMMON_PMH,
  DEPARTMENTS,
  DURATION_UNITS,
  FAMILY_DISEASES,
  GENDERS,
  MARITAL,
  NATIONALITY,
  OCCUPATIONS,
  RELIABILITY,
  VITALS,
  ROS,
  PE_COMMON,
  PE_SPECIAL,
  emptyDocMeta,
  emptyRecord,
  todayStr,
  PE_INDEX,
  findPEItem,
  childPEItems,
  peItemFilled,
  parentSupersededByChild,
  peValueIsDefault,
  peChecked,
  setPeChecked,
  peNormalText,
  FACT_STATES,
  normalizeFactState,
  rosFactState,
  peFactState,
  inferPeFactState,
  setPeFactState
};

export const SCHEMA = {
  GENDERS,
  MARITAL,
  OCCUPATIONS,
  NATIONALITY,
  RELIABILITY,
  DURATION_UNITS,
  ROS,
  COMMON_PMH,
  ALLERGENS,
  ALLERGY_REACTIONS,
  FAMILY_DISEASES,
  VITALS,
  PE_COMMON,
  PE_SPECIAL,
  DEPARTMENTS,
  emptyRecord,
  todayStr,
  PE_INDEX,
  findPEItem,
  childPEItems,
  peItemFilled,
  parentSupersededByChild,
  peValueIsDefault,
  peChecked,
  setPeChecked,
  peNormalText,
  FACT_STATES,
  normalizeFactState,
  rosFactState,
  peFactState,
  inferPeFactState,
  setPeFactState
};

export default SCHEMA;
