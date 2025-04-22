import { ROLES, SUBSCRIPTION_PLANS } from "./constants";

export type Role = typeof ROLES[keyof typeof ROLES];
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];

export interface QuestionResponse {
  questionId: number;
  value: number; // 0 to 6, where 0 is middle, -3 to +3 represented as 0-6
  statement1Role: Role;
  statement2Role: Role;
}

export interface RoleResults {
  [ROLES.APOSTLE]: number;
  [ROLES.PROPHET]: number;
  [ROLES.EVANGELIST]: number;
  [ROLES.HERDER]: number;
  [ROLES.TEACHER]: number;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  roleResults: RoleResults;
  primaryRole: Role;
}
