import * as functions from 'firebase-functions';
import { ethers } from 'ethers';
import * as admin from 'firebase-admin';

// NFT Contract ABI (simplified for Proof-of-Commitment NFT)
const NFT_CONTRACT_ABI = [
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Contract address for deployed Proof-of-Commitment NFT contract on Sepolia
const NFT_CONTRACT_ADDRESS = functions.config().nft?.contract_address || process.env.NFT_CONTRACT_ADDRESS;

// Sepolia RPC URL
const SEPOLIA_RPC_URL = functions.config().sepolia?.rpc_url || process.env.SEPOLIA_RPC_URL;

// Private key for the contract owner (who can mint NFTs)
const CONTRACT_OWNER_PRIVATE_KEY = functions.config().nft?.owner_private_key || process.env.CONTRACT_OWNER_PRIVATE_KEY;

interface NFTMintRequest {
  goalId: string;
  goalTitle: string;
  smartSummary: string;
  milestones: string[];
  userUID: string;
  walletAddress: string;
}

interface NFTMintResponse {
  success: boolean;
  tokenId?: string;
  contractAddress?: string;
  metadataURL?: string;
  transactionHash?: string;
  error?: string;
}

export const mintProofOfCommitmentNFT = functions.https.onCall(async (data: NFTMintRequest, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { goalId, goalTitle, smartSummary, milestones, userUID, walletAddress } = data;

    // Validate input
    if (!goalId || !goalTitle || !userUID || !walletAddress) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    // Validate wallet address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid wallet address');
    }

    // Check if NFT contract is configured
    if (!NFT_CONTRACT_ADDRESS || !CONTRACT_OWNER_PRIVATE_KEY || !SEPOLIA_RPC_URL) {
      console.warn('NFT contract not configured, skipping NFT minting');
      return {
        success: false,
        error: 'NFT contract not configured',
      } as NFTMintResponse;
    }

    // Create provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(CONTRACT_OWNER_PRIVATE_KEY, provider);

    // Create contract instance
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);

    // Generate NFT metadata
    const metadata = {
      name: `Proof of Commitment: ${goalTitle}`,
      description: `A soulbound NFT representing commitment to the goal: ${goalTitle}. This NFT cannot be transferred and serves as proof of your dedication to achieving this goal.`,
      image: "https://agilow.app/nft-placeholder.png", // Placeholder image
      attributes: [
        {
          trait_type: "Goal Type",
          value: "Personal Achievement"
        },
        {
          trait_type: "Milestones",
          value: milestones.length
        },
        {
          trait_type: "Start Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Commitment Level",
          value: "High"
        }
      ],
      goalTitle,
      startDate: new Date().toISOString().split('T')[0],
      userUID,
      milestones,
      smartSummary,
      external_url: `https://agilow.app/goal/${goalId}`
    };

    // Upload metadata to IPFS (simplified - in production, use a proper IPFS service)
    const metadataURL = await uploadMetadataToIPFS(metadata);

    // Mint NFT
    const mintTx = await contract.mint(walletAddress, metadataURL);
    const receipt = await mintTx.wait();

    // Get token ID from Transfer event
    const transferEvent = receipt.events?.find((e: any) => e.event === 'Transfer');
    const tokenId = transferEvent?.args?.tokenId?.toString();

    if (!tokenId) {
      throw new Error('Failed to get token ID from mint transaction');
    }

    // Store NFT data in Firestore
    await admin.firestore().collection('nfts').doc(`${goalId}_${tokenId}`).set({
      goalId,
      tokenId,
      contractAddress: NFT_CONTRACT_ADDRESS,
      metadataURL,
      transactionHash: receipt.transactionHash,
      userUID,
      walletAddress,
      mintedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      tokenId,
      contractAddress: NFT_CONTRACT_ADDRESS,
      metadataURL,
      transactionHash: receipt.transactionHash,
    } as NFTMintResponse;

  } catch (error) {
    console.error('Error minting NFT:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mint NFT',
    } as NFTMintResponse;
  }
});

export const getNFTMetadata = functions.https.onCall(async (data: { metadataURL: string }, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { metadataURL } = data;

    if (!metadataURL) {
      throw new functions.https.HttpsError('invalid-argument', 'Metadata URL is required');
    }

    // Fetch metadata from IPFS
    const response = await fetch(metadataURL);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata from IPFS');
    }

    const metadata = await response.json();
    return metadata;

  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to fetch NFT metadata');
  }
});

// Helper function to upload metadata to IPFS
async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  try {
    // In a production environment, you would use a proper IPFS service like Pinata or Infura
    // For demo purposes, we'll use a mock IPFS URL
    const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const metadataURL = `https://ipfs.io/ipfs/${mockIPFSHash}`;
    
    // In production, you would actually upload to IPFS here
    console.log('Metadata would be uploaded to IPFS:', metadataURL);
    console.log('Metadata content:', JSON.stringify(metadata, null, 2));
    
    return metadataURL;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

