
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

export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  dateAdded: string;
  notes?: string;
  salary?: string;
}
