/** Public, JSON-compatible domain types shared by the web app and future clients. */

export type SourceKind = 'manual' | 'template' | 'legacy' | 'generated' | 'unknown';
export type FieldSource =
  | 'manual'
  | 'template'
  | 'default'
  | 'example'
  | 'generated'
  | 'legacy'
  | 'ai'
  | '';
export type Polarity = 'positive' | 'negative' | 'unknown';
export type DocumentKind = 'record' | 'firstCourse' | 'discharge';
export type DiagnosticSeverity = 'error' | 'warning' | 'info';
export type FactState =
  | 'asked_positive'
  | 'asked_negative'
  | 'not_asked'
  | 'default_normal_pending_review'
  | 'manual_text';

export interface Evidence {
  path?: string;
  text: string;
  source?: SourceKind;
}

export interface Fact {
  path: string;
  text: string;
  polarity: Polarity;
  state?: FactState;
  source: SourceKind;
  reviewed: boolean;
  evidence?: Evidence[];
  onset?: string;
  duration?: string;
  laterality?: string;
}

export interface DocumentSection {
  title: string;
  heading?: string;
  paragraphs: string[];
  facts: Fact[];
  warnings: DocumentWarning[];
}

export interface DocumentWarning {
  code: string;
  severity: DiagnosticSeverity;
  path: string;
  message: string;
  paths?: string[];
  document?: DocumentKind;
  action?: string;
  evidence?: Evidence[];
}

export interface DocumentIR {
  kind: DocumentKind;
  title: string;
  sections: DocumentSection[];
  text: string;
  warnings: DocumentWarning[];
}

export interface RecordDocumentBundle {
  record: DocumentIR;
  firstCourse: DocumentIR;
  discharge: DocumentIR;
}

export interface FieldState {
  source: FieldSource;
  reviewed: boolean;
  reviewedValueHash: string;
  sourceRef: string;
}

export interface MarriageConflict {
  basicValue?: string;
  marriageValue?: string;
  resolved?: boolean;
  chosen?: string;
  resolvedAt?: string;
}

export interface RecordMeta {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  revision?: number;
  fieldStates?: Record<string, Partial<FieldState> | undefined>;
  conflicts?: {
    marriage?: MarriageConflict;
    [key: string]: unknown;
  };
  migratedFrom?: number | string | null;
  migrationNotes?: string[];
  /** 迁移时无法按当前结构映射的旧值：{ '字段路径': 原值 }，保证旧数据不丢失 */
  legacyUnmapped?: Record<string, unknown>;
  lastTemplateFill?: {
    key: string;
    name: string;
    at: string;
    filled: string[];
    values: Record<string, string>;
  } | null;
  aiProvenance?: Record<string, unknown>;
}

export interface BasicSection {
  department: string;
  name: string;
  gender: string;
  age: string;
  birthDate: string;
  marital: string;
  nativePlace: string;
  birthPlace: string;
  nationality: string;
  occupation: string;
  workUnit: string;
  address: string;
  phone: string;
  recordNo: string;
  bedNo: string;
  ward?: string;
  admitDate: string;
  admitTime: string;
  recordDate: string;
  recordTime: string;
  reliability: string;
  informant: string;
  chiefComplaint: string;
  chiefComplaintDuration: string;
  chiefComplaintDurationUnit: string;
}

export interface HpiSection {
  mode?: 'structured' | 'manual' | string;
  manual?: string;
  onset: string;
  cause: string;
  symptoms: string;
  aggravating?: string;
  relief: string;
  evolution: string;
  accompanying: string;
  negativeDiscriminating: string;
  negativePertinent?: string;
  treatment: string;
  generalCondition: string;
  extra: string;
}

export interface RosEntry {
  checked?: boolean;
  negative?: boolean;
  status?: FactState | string;
  factState?: FactState | string;
  time?: string;
  detail?: string;
}

export type RosStore = Record<string, Record<string, RosEntry | undefined> | undefined>;

export interface PmhSection {
  health: string;
  diseaseChecks: Record<string, boolean>;
  diseaseOther: string;
  diseaseDetail: string;
  longTermMeds: string;
  infection: string;
  surgery: string;
  trauma: string;
  transfusion: string;
  poisoning: string;
  vaccine: string;
  allergy: string;
  allergenChecks: Record<string, boolean>;
  allergenOther: string;
  allergenReactionChecks: Record<string, boolean>;
  allergyReaction: string;
  relatedHistory: string;
  otherTreatDiseases: string;
  special: string;
}

export interface PersonalSection {
  maternal: string;
  birth: string;
  feeding: string;
  growth: string;
  residence: string;
  travel: string;
  smoking: string;
  smokingAmount: string;
  drinking: string;
  drinkingAmount: string;
  drugs: string;
  environment: string;
  habits: string;
  sexualHistory: string;
  occupationEnv: string;
  premorbidPersonality: string;
  stressEvent: string;
}

export interface MarriageSection {
  status: string;
  age: string;
  spouseHealth: string;
  sexLife: string;
  relation: string;
}

/** 月经史「月经情况」的取值：有月经 / 已绝经 / 未初潮 / 未选择。 */
export type MenstruationApplicable = '有' | '无' | '未初潮' | '';

export interface MenstruationSection {
  /** '有' = 有月经；'无' = 已绝经；'未初潮' = 尚未月经来潮；'' = 未选择。 */
  applicable: MenstruationApplicable | boolean | string;
  age: string;
  cycle: string;
  duration: string;
  quantity: string;
  color: string;
  clot: string;
  leukorrhea: string;
  lmp: string;
  menopauseAge: string;
  dysmenorrhea: string;
  extra?: string;
}

export interface ChildbirthSection {
  applicable: string | boolean;
  fullTerm: string;
  premature: string;
  abortion: string;
  alive: string;
  /** 子女数（男性婚育史用；旧数据可能误存在 gravida，生成时回退读取）。 */
  children: string;
  gravida: string;
  para: string;
  details: string;
  lastBirth: string;
  contraception: string;
}

export interface FamilySection {
  diseaseChecks: Record<string, boolean>;
  other: string;
  deceased: string;
  threeGeneration: string;
  similarDisease: string;
  infectionHistory: string;
}

export type FieldStore = Record<string, string | boolean | undefined>;

export interface PhysicalExamSection {
  checked: Record<string, FieldStore | undefined>;
  vitals: FieldStore;
  general: FieldStore;
  skin: FieldStore;
  head: FieldStore;
  neck: FieldStore;
  chest: FieldStore;
  abdomen: FieldStore;
  genital: FieldStore;
  spine: FieldStore;
  nervousPE: FieldStore;
  [key: `special_${string}`]: FieldStore | undefined;
}

export interface AuxiliaryItem {
  category?: string;
  name: string;
  result: string;
  date?: string;
  hospital?: string;
  no?: string;
}

export interface DiagnosisSection {
  confirmed: string[];
  newLine: string;
  signature: string;
}

export interface SoapBasisRow {
  diagnosis?: string;
  history?: string;
  pe?: string;
  aux?: string;
}

export interface SoapDiffRow {
  diagnosis?: string;
  why?: string;
  against?: string;
  points?: string;
}

export interface SoapPlanRow {
  diagnosis?: string;
  exam?: string;
  treatment?: string;
}

export interface SoapSection {
  recordTime: string;
  s: { summary: string; consistency: string };
  o: { pe: string; aux: string };
  a: {
    basis: string;
    basisDetail: SoapBasisRow[];
    ranking: string;
    diff: SoapDiffRow[];
    diffNote: string;
  };
  p: {
    principle: string;
    perDiagnosis: SoapPlanRow[];
    individual: string;
  };
}

export interface DischargeAdvice {
  drug: string;
  nonDrug: string;
  lifestyle: string;
  followUp: string;
}

export interface DischargeSection {
  dischargeDate: string;
  admitCondition: string;
  course: string;
  dischargeStatus: string;
  diagnoses: string[];
  diagnosesConfirmed: boolean;
  advice: DischargeAdvice;
}

export interface FocusPeSection {
  keys: string[];
  note: string;
}

export interface DocumentEntryMeta {
  origin: string;
  inputFingerprint: string;
  textHash: string;
  reviewedFingerprint: string;
  updatedAt?: string;
}

export interface DocumentDiagnosesMeta {
  origin: string;
  inputFingerprint: string;
  textHash: string;
  confirmed: boolean;
  confirmedFingerprint: string;
  updatedAt?: string;
}

export interface DocumentMetaStore {
  summary?: DocumentEntryMeta;
  firstCourse?: {
    s?: DocumentEntryMeta;
    oPe?: DocumentEntryMeta;
    oAux?: DocumentEntryMeta;
    basis?: DocumentEntryMeta;
    [key: string]: DocumentEntryMeta | undefined;
  };
  discharge?: {
    admitCondition?: DocumentEntryMeta;
    diagnoses?: DocumentDiagnosesMeta;
    [key: string]: DocumentEntryMeta | DocumentDiagnosesMeta | undefined;
  };
  [key: string]: unknown;
}

export interface DabingliRecord {
  id?: string;
  schemaVersion?: number;
  updatedAt?: string;
  ward?: string;
  /** Original notes entered on the AI page. Kept with the record, excluded from backups by default. */
  rawNotes?: string;
  meta: RecordMeta;
  documentMeta?: DocumentMetaStore;
  basic: BasicSection;
  hpi: HpiSection;
  ros: RosStore;
  peFactStates?: Record<string, Record<string, FactState | { state?: FactState; status?: FactState } | undefined> | undefined>;
  peDefaults?: Record<string, unknown>;
  peChecked?: Record<string, unknown>;
  fieldStates?: Record<string, unknown>;
  aiProvenance?: Record<string, unknown>;
  pmh: PmhSection;
  personal: PersonalSection;
  marriage: MarriageSection;
  menstruation: MenstruationSection;
  childbirth: ChildbirthSection;
  family: FamilySection;
  pe: PhysicalExamSection;
  auxiliary: { items: AuxiliaryItem[] };
  summary: string;
  diagnosis: DiagnosisSection;
  soap: SoapSection;
  discharge: DischargeSection;
  focusPE: FocusPeSection;
  suggestions: { accepted: string[] };
}

export interface RecordListItem {
  id: string;
  updatedAt: string;
  schemaVersion?: number;
  basic?: Partial<BasicSection>;
  data: DabingliRecord;
}

export interface RecordSummary {
  id: string;
  name: string;
  gender: string;
  age: string;
  birthDate: string;
  admitDate: string;
  department: string;
  chiefComplaint: string;
  updatedAt: string;
}

export interface AppSettings {
  rosMode: 'detail' | 'brief';
  fontScale: number;
  lastStep: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadListResult {
  ok: boolean;
  list: RecordListItem[];
  fresh?: boolean;
  corrupt?: boolean;
  error?: boolean;
  reason?: string;
  raw?: string;
}

export interface LoadCurrentResult {
  ok: boolean;
  record: DabingliRecord | null;
  fresh?: boolean;
  missingDraft?: boolean;
  migrated?: boolean;
  corrupt?: boolean;
  error?: boolean;
  reason?: string;
  raw?: string;
}

export interface SaveResult {
  ok: boolean;
  record?: DabingliRecord;
  revision?: number;
  error?: boolean;
  corrupt?: boolean;
  conflict?: boolean;
  remote?: DabingliRecord;
  remoteRevision?: number;
  reason?: string;
  raw?: string;
}

export interface SettingsResult {
  ok: boolean;
  settings: AppSettings;
  corrupt?: boolean;
  raw?: string;
}

export interface ImportRecord {
  id: string;
  updatedAt: string;
  /** True only when a notes-enabled backup explicitly carried this record's rawNotes key. */
  rawNotesIncluded?: boolean;
  data: DabingliRecord;
}

export interface ImportResult {
  records: ImportRecord[];
  mode: 'bundle' | 'single';
  includesNotes?: boolean;
}

export interface ExportBundle {
  app: 'dabingli';
  schemaVersion: number;
  exportedAt: string;
  records: Array<{ id: string; updatedAt: string; data: DabingliRecord }>;
  includesDraft?: boolean;
  includesNotes?: boolean;
}

export interface Department {
  key: string;
  name: string;
  group: string;
  special: string[];
}

export interface RosSymptom {
  key: string;
  label: string;
  detail?: string;
}

export interface RosSystem {
  key: string;
  name: string;
  symptoms: RosSymptom[];
}

export interface PeItem {
  key: string;
  label: string;
  default?: string;
  legacyDefault?: string;
  normal?: string;
  normalVariants?: string[];
  options?: string[];
  parent?: string;
  depts?: string[];
  summaryOf?: string[];
}

export interface PeGroup {
  key: string;
  name: string;
  joinWith?: string;
  items: PeItem[];
}

export interface PeSpecialGroup {
  name: string;
  items: PeItem[];
}

export interface VitalDefinition {
  key: string;
  label: string;
  unit: string;
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  dept?: string;
}

export interface TemplateSource {
  kind?: string;
  label: string;
  note: string;
}

export interface Template {
  key: string;
  dept: string;
  name: string;
  alias?: string[];
  hint?: string;
  source?: TemplateSource;
  verified?: boolean;
  verificationStatus?: 'verified' | 'unverified' | string;
  verificationLabel?: string;
  record: Record<string, unknown>;
}

export interface TemplateApplyResult {
  ok: boolean;
  mode?: string;
  filled: string[];
  count: number;
  skipped?: string[];
  name?: string;
  dept?: string;
  values?: Record<string, string>;
}

export interface TemplatePlaceholder {
  path: string;
  placeholder: string;
  text: string;
}

export interface TemplateOutlineItem {
  path: string;
  section: string;
  label: string;
}

export interface Hint {
  id: string;
  name: string;
  hint: string;
  note: string;
  matched: string[];
  score: number;
  deptMatch: boolean;
}

export interface DepthItem {
  id: string;
  level: 'high' | 'mid' | 'low';
  section: string;
  message: string;
  label: string;
  code: string;
  severity: DiagnosticSeverity;
  path: string;
  paths: string[];
  document?: DocumentKind;
  action?: string;
  evidence: Evidence[];
}

export interface GenerateOptions {
  rosMode?: AppSettings['rosMode'];
}

export interface GeneratedRecord {
  text: string;
  sections: Record<string, string>;
  warnings: string[];
}

export type PeVitalsKey =
  | 'temperature'
  | 'pulse'
  | 'respiration'
  | 'sbp'
  | 'dbp'
  | 'height'
  | 'weight'
  | 'headCirc'
  | 'chestCirc'
  | 'abdCirc';

export type RecordBasicOrRecord = DabingliRecord | Partial<BasicSection> | null | undefined;

export interface VitalSnapshotEntry {
  raw: string;
  num: number;
}

export interface DocumentTemplateMetadata {
  key?: string;
  title: string;
  alias?: string[];
  sections?: readonly string[];
  [key: string]: unknown;
}

export type DocumentTemplateMap = Readonly<Record<string, DocumentTemplateMetadata>>;

export type BasisDetailItem = SoapBasisRow;
export type FirstCourseDiffItem = SoapDiffRow;
export type FirstCoursePlanItem = SoapPlanRow;
export type DocumentBundle = RecordDocumentBundle;
export type FactPolarity = Polarity;
export type FactSource = SourceKind;
