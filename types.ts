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
