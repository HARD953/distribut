// types/dashboard.ts
export interface PointOfSale {
  id: string;
  name: string;
  commune: string;
  quartier: string;
  type: string;
  brander: boolean;
  potentiel: string;
  score_global: number;
  visibilite: number;
  accessibilite: number;
  affluence: number;
  photos_count: number;
  eligibilite_branding: boolean;
  latitude: number;
  longitude: number;
  score_a: number;
  score_d: number;
  score_e: number;
}

export interface DashboardStats {
  total: number;
  brandes: number;
  non_brandes: number;
  premium: number;
  eligibles_branding: number;
  gps_valides: number;
  score_moyen: number;
  score_a_moyen: number;
  score_d_moyen: number;
  score_e_moyen: number;
}

export interface AgentPerformance {
  agent: string;
  total: number;
  gps_rate: number;
  complete_rate: number;
  photo_avg: number;
}