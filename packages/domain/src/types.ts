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

export interface Evidence {
  path?: string;
  text: string;
  source?: SourceKind;
}

export interface Fact {
  path: string;
  text: string;
  polarity: Polarity;
  source: SourceKind;
  reviewed: boolean;
  evidence?: Evidence[];
  onset?: string;
  duration?: string;
  laterality?: string;
}

export interface DocumentSection {
  title: string;
  paragraphs: string[];
  facts: Fact[];
  warnings: DocumentWarning[];
}

export interface DocumentWarning {
  code: string;
  severity: string;
  message: string;
  paths?: string[];
  document?: DocumentKind;
  action?: string;
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

export interface RecordMeta {
  createdAt?: string;
  updatedAt?: string;
  revision?: number;
  fieldStates?: Record<string, Partial<FieldState> | undefined>;
  conflicts?: Record<string, unknown>;
  migratedFrom?: string | null;
  migrationNotes?: string[];
  lastTemplateFill?: unknown;
  [key: string]: unknown;
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
  admitDate: string;
  admitTime: string;
  recordDate: string;
  recordTime: string;
  reliability: string;
  informant: string;
  chiefComplaint: string;
  chiefComplaintDuration: string;
  chiefComplaintDurationUnit: string;
  [key: string]: unknown;
}

export interface HpiSection {
  onset: string;
  cause: string;
  symptoms: string;
  relief: string;
  evolution: string;
  accompanying: string;
  negativeDiscriminating: string;
  treatment: string;
  generalCondition: string;
  extra: string;
  [key: string]: unknown;
}

export interface RosEntry {
  checked?: boolean;
  negative?: boolean;
  time?: string;
  detail?: string;
  [key: string]: unknown;
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
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface MarriageSection {
  status: string;
  age: string;
  spouseHealth: string;
  sexLife: string;
  relation: string;
  [key: string]: unknown;
}

export interface MenstruationSection {
  applicable: string;
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
  [key: string]: unknown;
}

export interface ChildbirthSection {
  applicable: string;
  fullTerm: string;
  premature: string;
  abortion: string;
  alive: string;
  gravida: string;
  para: string;
  details: string;
  lastBirth: string;
  contraception: string;
  [key: string]: unknown;
}

export interface FamilySection {
  diseaseChecks: Record<string, boolean>;
  other: string;
  deceased: string;
  threeGeneration: string;
  similarDisease: string;
  infectionHistory: string;
  [key: string]: unknown;
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
  [key: string]: FieldStore | Record<string, FieldStore | undefined> | undefined;
}

export interface AuxiliaryItem {
  name: string;
  result: string;
  date?: string;
  hospital?: string;
  no?: string;
  [key: string]: unknown;
}

export interface DiagnosisSection {
  confirmed: string[];
  newLine: string;
  signature: string;
  [key: string]: unknown;
}

export interface SoapBasisRow {
  diagnosis?: string;
  history?: string;
  pe?: string;
  aux?: string;
  [key: string]: unknown;
}

export interface SoapDiffRow {
  diagnosis?: string;
  why?: string;
  against?: string;
  points?: string;
  [key: string]: unknown;
}

export interface SoapPlanRow {
  diagnosis?: string;
  exam?: string;
  treatment?: string;
  [key: string]: unknown;
}

export interface SoapSection {
  recordTime: string;
  s: { summary: string; consistency: string; [key: string]: unknown };
  o: { pe: string; aux: string; [key: string]: unknown };
  a: {
    basis: string;
    basisDetail: SoapBasisRow[];
    ranking: string;
    diff: SoapDiffRow[];
    diffNote: string;
    [key: string]: unknown;
  };
  p: {
    principle: string;
    perDiagnosis: SoapPlanRow[];
    individual: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DischargeSection {
  dischargeDate: string;
  admitCondition: string;
  course: string;
  dischargeStatus: string;
  diagnoses: string[];
  diagnosesConfirmed: boolean;
  advice: {
    drug: string;
    nonDrug: string;
    lifestyle: string;
    followUp: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface FocusPeSection {
  keys: string[];
  note: string;
  [key: string]: unknown;
}

export interface DabingliRecord {
  id?: string;
  schemaVersion?: number;
  updatedAt?: string;
  meta: RecordMeta;
  documentMeta?: Record<string, unknown>;
  basic: BasicSection;
  hpi: HpiSection;
  ros: RosStore;
  pmh: PmhSection;
  personal: PersonalSection;
  marriage: MarriageSection;
  menstruation: MenstruationSection;
  childbirth: ChildbirthSection;
  family: FamilySection;
  pe: PhysicalExamSection;
  auxiliary: { items: AuxiliaryItem[]; [key: string]: unknown };
  summary: string;
  diagnosis: DiagnosisSection;
  soap: SoapSection;
  discharge: DischargeSection;
  focusPE: FocusPeSection;
  suggestions: { accepted: string[]; [key: string]: unknown };
  [key: string]: unknown;
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
  data: DabingliRecord;
}

export interface ImportResult {
  records: ImportRecord[];
  mode: 'bundle' | 'single';
}

export interface ExportBundle {
  app: 'dabingli';
  schemaVersion: number;
  exportedAt: string;
  records: Array<{ id: string; updatedAt: string; data: DabingliRecord }>;
  includesDraft?: boolean;
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
  normal?: string;
  normalVariants?: string[];
  options?: string[];
  parent?: string;
  depts?: string[];
}

export interface PeGroup {
  key: string;
  name: string;
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
  min?: number;
  max?: number;
  placeholder?: string;
  dept?: string;
}

export interface TemplateSource {
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
  record: Record<string, unknown>;
  [key: string]: unknown;
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
  level: 'high' | 'medium' | 'low' | string;
  section: string;
  message: string;
  label: string;
}

export interface GenerateOptions {
  rosMode?: AppSettings['rosMode'];
}

export interface GeneratedRecord {
  text: string;
  sections: Record<string, string>;
  warnings: string[];
}
