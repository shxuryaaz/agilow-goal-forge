import { Timestamp } from 'firebase/firestore';

// User Profile Interface
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  badges: string[];
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  trelloToken?: string;
  slackToken?: string;
  wallet?: WalletData;
}

// Wallet Data Interface
export interface WalletData {
  publicAddress: string;
  createdAt: Timestamp;
}

// Goal Interface
export interface Goal {
  id: string;
  userId: string;
  goal: string;
  smartSummary: string;
  milestones: Milestone[];
  risks: Risk[];
  timeline: TimelineItem[];
  status: 'active' | 'completed' | 'paused';
  xpAwarded: number;
  trelloBoardUrl?: string;
  trelloBoardId?: string;
  nft?: NFTData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// NFT Data Interface
export interface NFTData {
  tokenId: string;
  contractAddress: string;
  metadataURL: string;
  transactionHash?: string;
  mintedAt: Timestamp;
}

// Milestone Interface
export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Timestamp;
  xpReward: number;
  trelloCardId?: string;
}

// Risk Interface
export interface Risk {
  id: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'resolved';
}

// Timeline Item Interface
export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed';
}

// Badge Interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
  category: 'goal' | 'milestone' | 'streak' | 'special';
}

// Achievement Interface
export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Timestamp;
  xpAwarded: number;
}

// Chat Message Interface
export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
  timestamp: Timestamp;
  goalId?: string;
}

// OpenAI Response Interface
export interface OpenAIGoalResponse {
  goal: string;
  SMART_summary: string;
  milestones: Omit<Milestone, 'id' | 'status' | 'trelloCardId'>[];
  risks: Omit<Risk, 'id' | 'status'>[];
  timeline: Omit<TimelineItem, 'id' | 'status'>[];
}

// NFT Metadata Interface
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  goalTitle: string;
  startDate: string;
  userUID: string;
  milestones: string[];
  smartSummary: string;
  external_url: string;
}
