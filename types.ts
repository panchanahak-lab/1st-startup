export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export interface ServiceItem {
  title: string;
  icon: string;
  description: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  review: string;
  stars: number;
}

export interface TrustIndicator {
  icon: string;
  title: string;
  description: string;
}

// Fix: Added missing JobStatus type used in JobTracker.tsx
export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer';

// Fix: Added missing JobApplication interface used in JobTracker.tsx
export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  dateAdded: string;
}

export interface EducationItem {
  id: number;
  degree: string;
  school: string;
  year: string;
  grade: string;
}

export interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  location: string;
  date: string;
  bullets: string[];
}

export interface LanguageItem {
  id: number;
  name: string;
  level: string;
}

export interface CertificationItem {
  id: number;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeData {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  website: string;
  targetRole: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  hardSkills: string;
  softSkills: string;
  certifications: CertificationItem[];
  languages: LanguageItem[];
}
