# NFT & Wallet Setup Guide for Agilow

This guide will help you set up the BIP-39 wallet creation and Proof-of-Commitment NFT minting functionality for Agilow.

## Prerequisites

1. Firebase project set up (see FIREBASE_SETUP.md)
2. Node.js and npm installed
3. Hardhat installed globally: `npm install -g hardhat`
4. MetaMask installed in your browser
5. Sepolia testnet ETH (get from faucets like https://sepoliafaucet.com/)

## Step 1: Install Contract Dependencies

```bash
cd contracts
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the contracts directory:

```env
# Sepolia RPC URL (Infura or Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Private key for deployment (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Step 3: Deploy the NFT Contract

1. **Compile the contract:**
   ```bash
   npx hardhat compile
   ```

2. **Deploy to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Note the contract address** from the deployment output.

## Step 4: Verify Contract on Etherscan

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Step 5: Update Firebase Configuration

1. **Set contract address in Firebase Functions:**
   ```bash
   firebase functions:config:set nft.contract_address="YOUR_CONTRACT_ADDRESS"
   firebase functions:config:set sepolia.rpc_url="YOUR_SEPOLIA_RPC_URL"
   firebase functions:config:set nft.owner_private_key="YOUR_PRIVATE_KEY"
   ```

2. **Update your .env file in the main project:**
   ```env
   VITE_NFT_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
   VITE_SEPOLIA_RPC_URL=YOUR_SEPOLIA_RPC_URL
   ```

## Step 6: Deploy Firebase Functions

```bash
firebase deploy --only functions
```

## Step 7: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Create a new account** - you should see wallet creation
3. **Create a goal** - you should see NFT minting
4. **Check your wallet** on Sepolia Etherscan
5. **View NFT** on OpenSea testnet

## Contract Features

### Proof-of-Commitment NFT Contract

- **Soulbound**: NFTs cannot be transferred (soulbound)
- **Unique per goal**: One NFT per goal per user
- **Metadata**: Rich metadata with goal details
- **Gas efficient**: Optimized for low gas costs

### Key Functions

```solidity
// Mint a new NFT for a goal
function mint(address to, string memory goalId, string memory tokenURI) public onlyOwner

// Check if user has minted for a specific goal
function hasMintedForGoal(string memory goalId, address user) public view returns (bool)

// Get total supply
function totalSupply() public view returns (uint256)
```

## Wallet Security

### BIP-39 Wallet Generation

- **12-word seed phrase** generated client-side
- **Private keys never stored** in backend
- **HD wallet derivation** using standard path
- **Sepolia testnet** for safe testing

### Security Best Practices

1. **Never share seed phrases**
2. **Store seed phrases offline**
3. **Use hardware wallets for mainnet**
4. **Test thoroughly on testnets**

## NFT Metadata Structure

```json
{
  "name": "Proof of Commitment: [Goal Title]",
  "description": "A soulbound NFT representing commitment to the goal...",
  "image": "https://agilow.app/nft-placeholder.png",
  "attributes": [
    {
      "trait_type": "Goal Type",
      "value": "Personal Achievement"
    },
    {
      "trait_type": "Milestones",
      "value": 5
    },
    {
      "trait_type": "Start Date",
      "value": "2024-01-15"
    },
    {
      "trait_type": "Commitment Level",
      "value": "High"
    }
  ],
  "goalTitle": "Run a half marathon",
  "startDate": "2024-01-15",
  "userUID": "abc123",
  "milestones": ["Week 1: Training plan", "Week 2: 5km run"],
  "smartSummary": "SMART goal summary...",
  "external_url": "https://agilow.app/goal/abc123"
}
```

## Troubleshooting

### Common Issues

1. **Contract deployment fails:**
   - Check you have Sepolia ETH
   - Verify RPC URL is correct
   - Ensure private key has sufficient balance

2. **NFT minting fails:**
   - Check contract address in Firebase config
   - Verify wallet address is valid
   - Check Firebase Functions logs

3. **Wallet not showing:**
   - Check user profile in Firestore
   - Verify wallet creation during signup
   - Check browser console for errors

### Useful Commands

```bash
# Check contract on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# View contract on Sepolia Etherscan
https://sepolia.etherscan.io/address/CONTRACT_ADDRESS

# View NFT on OpenSea testnet
https://testnets.opensea.io/assets/sepolia/CONTRACT_ADDRESS/TOKEN_ID

# Check Firebase Functions logs
firebase functions:log
```

## Production Considerations

### Security

1. **Use hardware wallets** for contract owner
2. **Implement multi-sig** for contract upgrades
3. **Regular security audits**
4. **Monitor for unusual activity**

### Scalability

1. **IPFS for metadata** (currently using mock URLs)
2. **Batch minting** for multiple goals
3. **Gas optimization** for lower costs
4. **Layer 2 solutions** for mainnet

### Monitoring

1. **Contract events** for minting activity
2. **Firebase Analytics** for user behavior
3. **Error tracking** for failed transactions
4. **Performance monitoring** for gas costs

## Demo Flow

1. **User signs up** → BIP-39 wallet created
2. **User creates goal** → AI processes goal
3. **NFT minted** → Proof-of-commitment created
4. **Dashboard shows** → Wallet, NFT, progress
5. **Milestone completed** → XP awarded, progress updated

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase Functions logs
3. Check contract on Etherscan
4. Verify environment variables

## Next Steps

1. **Deploy to mainnet** (when ready)
2. **Implement IPFS** for metadata storage
3. **Add more NFT utilities** (burning, updating)
4. **Integrate with more chains** (Polygon, Arbitrum)
5. **Add NFT marketplace** features

This setup provides a complete Web3 integration for Agilow with secure wallet generation and soulbound NFT minting for goal commitments! 🚀

