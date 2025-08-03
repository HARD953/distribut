export interface StatItem {
  icon: string;
  title: string;
  value: string;
  change: string;
  color: string;
}

export interface ActivityItem {
  icon: string;
  action: string;
  user: string;
  time: string;
  color: string;
}

export interface AlertItem {
  icon: string;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface POSData {
  pos_id: number | null;
  pos_name: string;
  stats: StatItem[];
  recent_activities: ActivityItem[];
  alerts: AlertItem[];
}

export interface User {
  id: number;
  username?: string;
  email?: string;
}
