import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import { processGoalWithAI } from './ai';
import { createTrelloBoard } from './trello';
import { sendSlackNotification } from './slack';
import { mintProofOfCommitmentNFT, getNFTMetadata } from './nft';

// Export all functions
export {
  processGoalWithAI,
  createTrelloBoard,
  sendSlackNotification,
  mintProofOfCommitmentNFT,
  getNFTMetadata,
};
