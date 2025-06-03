export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  image: string;
  link?: string;
  github?: string;
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  duration: string;
  description: string[];
  technologies?: string[];
  type: 'it' | 'non-it';
}

export interface TechStack {
  category: string;
  items: TechItem[];
}

export interface TechItem {
  name: string;
  icon: string;
  color: string;
}

export interface Certificate {
  id: number;
  title: string;
  description: string;
  issuer: string;
  date: string;
  animation: string;
  link?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  animation: string;
  metrics?: {
    icon: string;
    text: string;
  }[];
}