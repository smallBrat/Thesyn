export enum ComprehensionLevel {
  HighSchool = 'High School',
  Undergraduate = 'Undergraduate',
  Graduate = 'Graduate'
}

export interface AnalysisResult {
  summary: string;
  glossary: { term: string; definition: string }[];
  keyInsights: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export type DocumentInputType = 'pdf' | 'text' | 'url';

export type DocumentContext = 
  | { type: 'text'; content: string }
  | { type: 'pdf'; content: string } // content is base64 string
  | { type: 'url'; content: string };
