
export interface FormData {
  client: string;
  companyBrief: string;
  brandGuidelines: string;
  targetKeyword: string;
  seoTitle: string;
  articleDirection: string;
  wordCountTarget: string;
  competitorUrls: string;
  paaQuestions: string;
  location: string;
  contentType: string;
  authorInfo: string;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface ImagePrompt {
  id: string;
  title: string;
  rationale: string;
  gemini_prompt: string;
  generatedImage?: string;
  isLoading?: boolean;
}

export interface BriefHistoryItem {
  id: number;
  timestamp: string;
  client: string;
  keyword: string;
  brief: string;
  research?: string;
  article?: string;
  groundingLinks?: GroundingLink[];
  imagePrompts?: ImagePrompt[];
}

export interface Client {
  id: string;
  name: string;
  brief: string;
  brandGuidelines: string;
}

export interface CompetitorAnalysis {
  url: string;
  analysis: string;
  links?: GroundingLink[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ViewState = 'input' | 'brief' | 'history' | 'clients' | 'cover';

export type DisplayMode = 'formatted' | 'markdown';

export type BriefTab = 'strategy' | 'research' | 'writer' | 'cover';

export type ImageStyle = 'PHOTOREALISTIC' | 'FLAT VECTOR' | 'ISOMETRIC' | 'SIMPLE CARTOON' | 'CLAUDE STYLE' | '3D RENDER' | 'ABSTRACT' | 'INFOGRAPHIC' | 'CUSTOM';
