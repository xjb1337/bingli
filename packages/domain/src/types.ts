/** Pure domain model types. Runtime modules remain JSON-compatible for legacy imports. */
export type SourceKind = 'manual' | 'template' | 'legacy' | 'generated' | 'unknown';
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
