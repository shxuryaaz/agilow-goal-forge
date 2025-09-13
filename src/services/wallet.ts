import * as bip39 from 'bip39';
import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  mnemonic: string;
  privateKey: string;
}

export interface WalletData {
  publicAddress: string;
  createdAt: Date;
}

/**
 * Generate a new BIP-39 wallet with 12-word seed phrase
 * This should only be called client-side for security
 */
export const generateWallet = (): WalletInfo => {
  try {
    // Generate a random mnemonic (12 words)
    const mnemonic = bip39.generateMnemonic();
    
    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic generated');
    }
    
    // Create HD wallet from mnemonic using ethers v6 API
    const hdNode = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic));
    
    // Derive the first account (m/44'/60'/0'/0/0)
    const wallet = hdNode.deriveChild(0);
    
    return {
      address: wallet.address,
      mnemonic: mnemonic,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate wallet');
  }
};

/**
 * Recover wallet from mnemonic phrase
 * This should only be called client-side for security
 */
export const recoverWalletFromMnemonic = (mnemonic: string): WalletInfo => {
  try {
    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    // Create HD wallet from mnemonic using ethers v6 API
    const hdNode = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic));
    
    // Derive the first account (m/44'/60'/0'/0/0)
    const wallet = hdNode.deriveChild(0);
    
    return {
      address: wallet.address,
      mnemonic: mnemonic,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('Error recovering wallet:', error);
    throw new Error('Failed to recover wallet from mnemonic');
  }
};

/**
 * Validate if an address is a valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Format address for display (show first 6 and last 4 characters)
 */
export const formatAddress = (address: string): string => {
  if (!isValidAddress(address)) {
    return 'Invalid Address';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get network info for Sepolia testnet
 */
export const getSepoliaNetwork = () => {
  return {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with your Infura key
    blockExplorer: 'https://sepolia.etherscan.io',
  };
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Request account access from MetaMask
 */
export const requestMetaMaskAccess = async (): Promise<string[]> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts;
  } catch (error) {
    console.error('Error requesting MetaMask access:', error);
    throw new Error('Failed to connect to MetaMask');
  }
};

/**
 * Switch to Sepolia network in MetaMask
 */
export const switchToSepoliaNetwork = async (): Promise<void> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
    });
  } catch (error: any) {
    // If the network doesn't exist, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding Sepolia network:', addError);
        throw new Error('Failed to add Sepolia network to MetaMask');
      }
    } else {
      console.error('Error switching to Sepolia network:', error);
      throw new Error('Failed to switch to Sepolia network');
    }
  }
};
