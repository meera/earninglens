/**
 * Brand and Enhancement Type Definitions
 */

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundGradient?: string[];
  text: string;
  textSecondary: string;
}

export interface Typography {
  heading: string;
  body: string;
  mono: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface Logo {
  url: string | null;
  backgroundColor: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface Animations {
  speed: 'fast' | 'medium' | 'slow';
  style: 'energetic' | 'professional' | 'smooth';
  transitions: string;
}

export interface BrandProfile {
  ticker: string;
  name: string;
  brandColors: BrandColors;
  typography: Typography;
  logo: Logo;
  visualStyle: string;
  animations: Animations;
  industry: string;
}

export interface Chapter {
  timestamp: number;
  title: string;
  description: string;
}

export interface Speaker {
  name: string;
  title: string;
  speaker_label: string;
  photoUrl?: string;
}

export interface Metric {
  metric: string;
  value: string;
  context: string;
}
