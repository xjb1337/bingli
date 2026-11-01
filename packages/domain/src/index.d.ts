import type {
  AppSettings,
  DabingliRecord,
  Department,
  DepthItem,
  DiagnosticSeverity,
  DocumentIR,
  DocumentWarning,
  ExportBundle,
  Fact,
  GenerateOptions,
  GeneratedRecord,
  Hint,
  ImportResult,
  LoadCurrentResult,
  LoadListResult,
  PeGroup,
  PeItem,
  PeSpecialGroup,
  RecordDocumentBundle,
  RecordListItem,
  RecordSummary,
  RosEntry,
  RosSystem,
  SaveResult,
  SettingsResult,
  StorageLike,
  Template,
  TemplateApplyResult,
  TemplateOutlineItem,
  VitalDefinition,
} from './types';

export * from './types';

export interface SchemaApi {
  GENDERS: readonly string[];
  MARITAL: readonly string[];
  OCCUPATIONS: readonly string[];
  NATIONALITY: string;
  RELIABILITY: readonly string[];
  DURATION_UNITS: readonly string[];
  ROS: readonly RosSystem[];
  COMMON_PMH: readonly string[];
  ALLERGENS: readonly string[];
  ALLERGY_REACTIONS: readonly string[];
  FAMILY_DISEASES: readonly string[];
  VITALS: readonly VitalDefinition[];
  PE_COMMON: readonly PeGroup[];
  PE_SPECIAL: Readonly<Record<string, PeSpecialGroup>>;
  DEPARTMENTS: readonly Department[];
  emptyRecord(): DabingliRecord;
  todayStr(): string;
  findPEItem(ref: string): PeItem | null;
  childPEItems(groupKey: string, parentKey: string): PeItem[];
  peItemFilled(store: Record<string, unknown>, item: PeItem): boolean;
  parentSupersededByChild(store: Record<string, unknown>, groupKey: string, parentKey: string): boolean;
  peValueIsDefault(item: PeItem, value: unknown): boolean;
  peChecked(record: DabingliRecord, groupKey: string, itemKey: string): boolean;
  setPeChecked(record: DabingliRecord, groupKey: string, itemKey: string, on: boolean): DabingliRecord;
  peNormalText(item: PeItem): string;
  FACT_STATES: readonly string[];
  normalizeFactState(value: unknown): string;
  rosFactState(entry: RosEntry | undefined): string;
  peFactState(record: DabingliRecord, groupKey: string, itemKey: string, item?: PeItem): string;
  inferPeFactState(item: PeItem | null, value: unknown): string;
  setPeFactState(record: DabingliRecord, groupKey: string, itemKey: string, state: string): DabingliRecord;
}

export interface CoreApi {
  SCHEMA_VERSION: number;
  STORAGE_KEYS: Readonly<{
    list: 'dabingli.records.v1';
    current: 'dabingli.current.v1';
    draftPrefix: 'dabingli.draft.v1.';
    settings: 'dabingli.settings.v1';
  }>;
  SETTINGS_DEFAULTS: Readonly<AppSettings>;
  getPath(value: unknown, path: string): unknown;
  setPath<T>(value: T, path: string, next: unknown): T;
  cloneValue<T>(value: T): T;
  stableStringify(value: unknown): string;
  fingerprint(value: unknown): string;
  hashText(text: string): string;
  fieldState(record: DabingliRecord, path: string): {
    source: string;
    reviewed: boolean;
    reviewedValueHash: string;
    sourceRef: string;
  };
  setFieldState(
    record: DabingliRecord,
    path: string,
    patch: Partial<{
      source: string;
      reviewed: boolean;
      reviewedValueHash: string;
      sourceRef: string;
    }>,
  ): DabingliRecord;
  markFieldManual(record: DabingliRecord, path: string, value?: unknown): DabingliRecord;
  markFieldReviewed(record: DabingliRecord, path: string, source?: string): DabingliRecord;
  fieldReviewValid(record: DabingliRecord, path: string, value?: unknown): boolean;
  markDocumentGenerated(record: DabingliRecord, kind: string): DabingliRecord;
  normalizeRecord(raw: unknown, emptyRecord: () => DabingliRecord, validDeptKeys: readonly string[]): DabingliRecord;
  normalizeSettings(raw: unknown): AppSettings;
  lookLikeRecord(value: unknown): boolean;
  uid(now?: number, random?: () => number): string;
  summarize(item: RecordListItem | DabingliRecord): RecordSummary;
  sortByUpdated(list: RecordListItem[]): RecordListItem[];
  upsertRecord(list: RecordListItem[], record: DabingliRecord, isoNow?: string): { list: RecordListItem[]; id: string };
  removeRecord(list: RecordListItem[], id: string): RecordListItem[];
  findRecord(list: RecordListItem[], id: string): RecordListItem | null;
  mergeListForWrite(stored: RecordListItem[], local: RecordListItem[]): RecordListItem[];
  buildExport(
    list: RecordListItem[],
    isoNow?: string,
    options?: { includeDraft?: boolean; draft?: DabingliRecord },
  ): ExportBundle;
  parseImport(raw: string, emptyRecord: () => DabingliRecord, validDeptKeys: readonly string[]): ImportResult;
  mergeImport(
    list: RecordListItem[],
    imported: ImportResult['records'],
  ): { list: RecordListItem[]; added: number; updated: number; skipped: number };
  replaceImport(imported: ImportResult['records']): RecordListItem[];
  loadList(storage: StorageLike): LoadListResult;
  loadCurrent(
    storage: StorageLike,
    emptyRecord: () => DabingliRecord,
    validDeptKeys: readonly string[],
    preferredId?: string,
  ): LoadCurrentResult;
  loadSettings(storage: StorageLike): SettingsResult;
  saveCurrent(storage: StorageLike, record: DabingliRecord, expectedRevision?: number): SaveResult;
  saveList(storage: StorageLike, list: RecordListItem[]): SaveResult;
  saveSettings(storage: StorageLike, settings: AppSettings): SaveResult;
  draftMatches(storage: StorageLike, record: DabingliRecord): boolean;
  draftKey(id: string): string;
  readRaw(storage: StorageLike, key: string): { ok: boolean; raw: string | null; missing?: boolean; error?: string };
  writeRaw(storage: StorageLike, key: string, value: string): { ok: boolean; error?: string };
  safeSet(storage: StorageLike, key: string, value: string): boolean;
  safeGetJSON(storage: StorageLike, key: string): unknown;
  memoryStorage(): StorageLike;
  marriageValue(record: DabingliRecord): string;
  marriageConflict(record: DabingliRecord): { basicValue?: string; marriageValue?: string } | null;
  resolveMarriage(record: DabingliRecord, value: string): DabingliRecord;
}

export interface GeneratorApi {
  generate(record: DabingliRecord, options?: GenerateOptions): GeneratedRecord;
  generatePlain(record: DabingliRecord, options?: GenerateOptions): string;
  validate(record: DabingliRecord): string[];
  validateStructured(record: DabingliRecord): DocumentWarning[];
  buildDocumentIR(record: DabingliRecord, kind?: 'record' | 'firstCourse' | 'discharge', options?: GenerateOptions & { date?: string }): DocumentIR;
  buildDocumentBundle(record: DabingliRecord, options?: GenerateOptions & { date?: string }): RecordDocumentBundle;
  buildFirstCourseRecord(record: DabingliRecord, options?: { date?: string }): string;
  buildDischargeRecord(record: DabingliRecord, options?: { date?: string }): string;
  buildChiefComplaint(record: DabingliRecord): string;
  buildBasicInfo(record: DabingliRecord): string;
  draftHPI(record: DabingliRecord): string;
  draftSummary(record: DabingliRecord): string;
  firstCourseSelfCheck(record: DabingliRecord): string[];
  firstCourseSelfCheckDiagnostics(record: DabingliRecord): DocumentWarning[];
  qualityDiagnostics(record: DabingliRecord): DocumentWarning[];
  vitalConsistencyDiagnostics(record: DabingliRecord): DocumentWarning[];
  factStateDiagnostics(record: DabingliRecord): DocumentWarning[];
  hpiQualityDiagnostics(record: DabingliRecord): DocumentWarning[];
  diagnosisList(record: DabingliRecord): string[];
}

export interface TemplatesApi {
  listByDept(dept: string): Template[];
  get(key: string): Template | null;
  all(): Template[];
  apply(record: DabingliRecord, key: string, options?: { mode?: 'example' | 'patient' }): TemplateApplyResult & {
    outline?: TemplateOutlineItem[];
  };
  previewPaths(key: string): string[];
  deptName(key: string): string;
  outlineOf(template: Template): TemplateOutlineItem[];
  SECTION_LABEL: Readonly<Record<string, string>>;
}

export interface DepthApi {
  check(record: DabingliRecord, settings?: AppSettings | null, options?: GenerateOptions): DepthItem[];
  count(record: DabingliRecord): { total: number; high: number; mid: number; low: number };
  LABEL: Readonly<Record<string, string>>;
  SYMPTOMS: readonly unknown[];
  DIAGNOSTIC_CODES: readonly string[];
}

export interface DiagnosticsApi {
  SEVERITIES: readonly DiagnosticSeverity[];
  create(input: Partial<DocumentWarning> & { code: string; path: string; message: string }): DocumentWarning;
  fromWarning(warning: DocumentWarning | string, defaults?: Partial<DocumentWarning>): DocumentWarning;
  isDiagnostic(value: unknown): value is DocumentWarning;
  assertValid(list: unknown[]): unknown[];
  codes(list: DocumentWarning[]): string[];
}

export interface HintsApi {
  analyze(record: DabingliRecord): Hint[];
  extractFindings(record: DabingliRecord): unknown;
  RULES: readonly unknown[];
  PE_ALIAS: Readonly<Record<string, string>>;
  PE_VALUE_ALIAS: Readonly<Record<string, string>>;
}

export const AGE: Record<string, unknown>;
export const SCHEMA: SchemaApi;
export const RECORD_CORE: CoreApi;
export const TEMPLATE_DATA: readonly unknown[];
export const TEMPLATES: TemplatesApi;
export const DEPTH: DepthApi;
export const DIAGNOSTICS: DiagnosticsApi;
export const GENERATOR: GeneratorApi;
export const HINTS: HintsApi;
export const DOC_IR: {
  section(title: string, body: string, facts?: Fact[], warnings?: readonly (DocumentWarning | string)[]): {
    title: string;
    paragraphs: string[];
    facts: Fact[];
    warnings: DocumentWarning[];
  };
  fromRecordText(
    kind: 'record' | 'firstCourse' | 'discharge',
    title: string,
    text: string,
    warnings?: readonly (DocumentWarning | string)[],
    sectionTitles?: readonly string[],
  ): DocumentIR;
  fromPlainText(
    kind: 'record' | 'firstCourse' | 'discharge',
    title: string,
    text: string,
    warnings?: readonly (DocumentWarning | string)[],
  ): DocumentIR;
  renderPlain(document: DocumentIR): string;
  renderRecord(document: DocumentIR): string;
  warningList(document: DocumentIR): DocumentWarning[];
  createFact(input: unknown): Fact | null;
  documentFromSections(
    kind: 'record' | 'firstCourse' | 'discharge',
    title: string,
    sections: readonly unknown[],
    warnings?: readonly (DocumentWarning | string)[],
    prefix?: string,
  ): DocumentIR;
  fromNumberedText(
    kind: 'record' | 'firstCourse' | 'discharge',
    title: string,
    text: string,
    warnings?: readonly (DocumentWarning | string)[],
    factsByTitle?: Readonly<Record<string, Fact[]>>,
  ): DocumentIR;
  renderDocument(document: DocumentIR): string;
  renderNumbered(document: DocumentIR): string;
  isBareTimeFragment(text: string): boolean;
  normalizeNegationScope(text: string): string;
  assembleClinicalNarrative(parts: readonly string[]): string[];
};
export const DOCUMENT_IR: typeof DOC_IR;
export const MIGRATIONS: {
  migrateRecord(raw: unknown, emptyRecord: () => DabingliRecord, validDeptKeys: readonly string[]): DabingliRecord;
  parseImport(raw: string, emptyRecord: () => DabingliRecord, validDeptKeys: readonly string[]): ImportResult;
  buildExport(list: RecordListItem[], isoNow?: string): ExportBundle;
  SCHEMA_VERSION: number;
};
