export interface LearningService {
  name: string;
  desc: string;
  uses: [string, string];
  tip?: string;
  exam?: boolean;
}

export interface LearningCluster {
  id: string;
  name: string;
  color: string;
  icon?: string;
  services: LearningService[];
}

