export interface GeoPoint {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
}

export interface CampaignImpact {
  itemsCollected: number;
  areaCleaned: number;
  co2Saved: number;
}

export interface CampaignFunding {
  current: number;
  goal: number;
  currency: string;
}

export interface CampaignTimeline {
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  daysRemaining: number;
}

export interface CampaignVolunteerSummary {
  participants: Array<{ name: string; avatar: string }>;
  current: number;
  goal: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  location: GeoPoint & { address: string };
  priority: 'low' | 'medium' | 'high' | 'critical';
  image: string;
  date: string | null;
  organizer: {
    name: string;
    avatar: string;
  };
  funding: CampaignFunding;
  volunteers: CampaignVolunteerSummary;
  esgImpact: CampaignImpact;
  hotspot?: Record<string, unknown>;
  goals?: Record<string, unknown>;
  timeline?: CampaignTimeline;
  metadata?: Record<string, unknown>;
}

export interface VolunteerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  experienceLevel: string;
  materialsExpertise: string[];
  specializations: string[];
  equipmentOwned: string[];
  location: GeoPoint;
  available: boolean;
  pastCleanupCount: number;
  hoursContributed?: number;
  badge?: string;
  rank?: number;
  bio?: string;
  profilePictureUrl?: string;
  distanceKm?: number | null;
  matchScore?: number;
  metadata?: Record<string, unknown>;
}

export interface TrashReport {
  id: string;
  primaryMaterial: string;
  estimatedVolume: string;
  description: string;
  cleanupPriority: number;
  recyclable: boolean;
  riskLevel: string;
  recommendedEquipment: string[];
  location: GeoPoint;
  timestamp: string | null;
  confidenceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface CampaignSearchFilters {
  text?: string;
  location?: GeoPoint;
  radiusKm?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'completed';
  limit?: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  source?: 'network' | 'memory-cache' | 'local-cache';
  timestamp?: string;
}
