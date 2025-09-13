import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { NFTMetadata } from '@/types/firebase';

// Cloud Functions
const mintProofOfCommitmentNFT = httpsCallable(functions, 'mintProofOfCommitmentNFT');
const getNFTMetadata = httpsCallable(functions, 'getNFTMetadata');

export interface MintNFTResponse {
  success: boolean;
  tokenId?: string;
  contractAddress?: string;
  metadataURL?: string;
  transactionHash?: string;
  error?: string;
}

export interface NFTInfo {
  tokenId: string;
  contractAddress: string;
  metadataURL: string;
  transactionHash?: string;
  metadata?: NFTMetadata;
}

/**
 * Mint a Proof-of-Commitment NFT for a goal
 */
export const mintGoalNFT = async (
  goalId: string,
  goalTitle: string,
  smartSummary: string,
  milestones: string[],
  userUID: string,
  walletAddress: string
): Promise<MintNFTResponse> => {
  try {
    const result = await mintProofOfCommitmentNFT({
      goalId,
      goalTitle,
      smartSummary,
      milestones,
      userUID,
      walletAddress,
    });

    return result.data as MintNFTResponse;
  } catch (error: any) {
    console.error('Error minting NFT:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint NFT',
    };
  }
};

/**
 * Get NFT metadata from IPFS
 */
export const fetchNFTMetadata = async (metadataURL: string): Promise<NFTMetadata | null> => {
  try {
    const result = await getNFTMetadata({ metadataURL });
    return result.data as NFTMetadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
};

/**
 * Generate NFT metadata object
 */
export const generateNFTMetadata = (
  goalTitle: string,
  smartSummary: string,
  milestones: string[],
  userUID: string,
  imageURL: string = 'https://agilow.app/nft-placeholder.png'
): NFTMetadata => {
  const startDate = new Date().toISOString().split('T')[0];
  
  return {
    name: `Proof of Commitment: ${goalTitle}`,
    description: `A soulbound NFT representing commitment to the goal: ${goalTitle}. This NFT cannot be transferred and serves as proof of your dedication to achieving this goal.`,
    image: imageURL,
    attributes: [
      {
        trait_type: 'Goal Type',
        value: 'Personal Achievement',
      },
      {
        trait_type: 'Milestones',
        value: milestones.length,
      },
      {
        trait_type: 'Start Date',
        value: startDate,
      },
      {
        trait_type: 'Commitment Level',
        value: 'High',
      },
    ],
    goalTitle,
    startDate,
    userUID,
    milestones,
    smartSummary,
    external_url: `https://agilow.app/goal/${userUID}`,
  };
};

/**
 * Format NFT display information
 */
export const formatNFTInfo = (nft: NFTInfo): string => {
  return `NFT #${nft.tokenId} - ${nft.contractAddress.slice(0, 6)}...${nft.contractAddress.slice(-4)}`;
};

/**
 * Get OpenSea URL for viewing NFT (Sepolia testnet)
 */
export const getOpenSeaURL = (contractAddress: string, tokenId: string): string => {
  return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
};

/**
 * Get Etherscan URL for viewing transaction
 */
export const getEtherscanURL = (transactionHash: string): string => {
  return `https://sepolia.etherscan.io/tx/${transactionHash}`;
};

/**
 * Validate NFT data
 */
export const validateNFTData = (nft: NFTInfo): boolean => {
  return !!(
    nft.tokenId &&
    nft.contractAddress &&
    nft.metadataURL &&
    nft.contractAddress.startsWith('0x') &&
    nft.contractAddress.length === 42
  );
};

