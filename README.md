# Content Authentication DApp

A decentralized application for the security and authentication of digital content using smart contracts and blockchain technology to combat copyright infringement and deepfakes.

## Project Overview

This application was developed as part of a university thesis project at the Department of Computer Science, University of Verona (2023-2024). The project addresses the growing threat of **deepfakes** and **copyright violations** by leveraging blockchain technology to ensure content authenticity, traceability, and creator control over digital rights.

### Problem Statement

The digital landscape faces two critical challenges:
- **Copyright Infringement**: Unauthorized use and distribution of digital content without creator consent
- **Deepfakes**: AI-manipulated media (videos, audio, images) that threaten authenticity and can damage reputations, spread misinformation, and undermine trust in digital content

### Solution

This application provides a **blockchain-based content authentication system** that:
- Registers digital content on an immutable blockchain ledger
- Guarantees content authenticity through cryptographic verification
- Enables creators to maintain control over their work and authorize derivative creations
- Protects artists from unauthorized deepfakes and content manipulation
- Implements a transparent permission system for content reuse

## Key Features

### Content Authentication & Protection
- **Unique Smart Contract per Content**: Each digital content is associated with a dedicated smart contract ensuring authenticity and provenance
- **Blockchain Registration**: Content metadata (author, hash, publication date) is permanently recorded on blockchain
- **IPFS Integration**: Decentralized file storage with Content Identifiers (CIDs) for verifiable integrity
- **Deepfake Prevention**: Immutable records make it difficult to spread falsified or manipulated content

### Artist Control & Rights Management
- **Artist Registration**: Users can register as artists to publish and protect their content
- **Content Publishing**: Upload files to IPFS and create protective smart contracts with content hash
- **Permission System**: Artists can approve or reject requests to reuse their content
- **Child Contracts**: Authorized derivative works are tracked through child contracts linked to the original

### Content Reuse & Licensing
- **Reuse Requests**: Any user can request permission to use protected content
- **Authorization Workflow**: Artists receive and manage requests through the application
- **Derivative Tracking**: Child contracts maintain references to parent contracts for complete traceability
- **Transparent Permissions**: All granted permissions are recorded on-chain

### Cross-Platform Support
- **Web Application**: Browser-based access via React interface
- **Android Mobile App**: Native mobile experience using Ionic framework
- **Wallet Integration**: MetaMask and other Web3 wallets supported via WalletConnect

## Technical Architecture

### Smart Contract Layer (Solidity)

**Factory Pattern Design**:
- **Factory Contract**: Central contract managing the entire ecosystem
  - Tracks registered artists
  - Manages content contract deployment
  - Stores all system interactions for UI updates
  
- **Content Contracts**: Individual contracts for each protected content
  - Store content metadata (author, IPFS hash, creation date)
  - Handle reuse requests and permissions
  - Deploy child contracts for authorized derivatives
  
- **Child Contracts**: Represent authorized reuse/remixes
  - Maintain reference to parent contract
  - Track permission grants and modifications
  - Ensure derivative works remain traceable

**Development & Deployment**:
- Developed with **Truffle** framework for local testing
- Deployed on **Binance Smart Chain (BSC) Testnet** for production simulation
- Written in **Solidity** with comprehensive testing

### Frontend Application (React + Ionic)

**Component Architecture**:

1. **Wallet Connection Component**:
   - Manages Web3 wallet integration (MetaMask recommended)
   - WalletConnect library for cross-platform compatibility
   - User identification and transaction signing
   - Account selection and connection management

2. **User Interface Component**:
   - **Dynamic Role-Based UI**:
     - **Non-Artist Users**: View published content, sent requests, acquired child contracts
     - **Artists**: All non-artist features + own content management, received requests, created child contracts
   
   - **Real-Time Updates**: Event listeners intercept smart contract events for instant UI synchronization
   
   - **Content Publishing**: Upload files to IPFS, create protective smart contracts with content hash
   
   - **Smart Contract Interaction**: Direct on-chain actions via UI buttons (write methods require gas fees)

**Technology Stack**:
- **TypeScript**: Type-safe development
- **React**: Reactive UI components
- **Ionic**: Cross-platform mobile framework (web + Android)
- **WalletConnect**: Multi-platform wallet integration
- **Wagmi Hooks**: Simplified smart contract interactions across platforms
- **IPFS**: Decentralized content storage

### Blockchain Infrastructure

- **Network**: Binance Smart Chain (BSC) Testnet
- **Storage**: InterPlanetary File System (IPFS) for decentralized file hosting
- **Smart Contract Platform**: Ethereum Virtual Machine (EVM) compatible
- **Development Tools**: Truffle, Ganache (local blockchain)

## How It Works

### For Artists:

1. **Registration**: Connect wallet and register as an artist
2. **Content Upload**: Upload digital content (images, videos, audio) to IPFS
3. **Contract Creation**: Deploy a smart contract storing content hash and metadata
4. **Request Management**: Review and approve/reject reuse requests from other users
5. **Derivative Tracking**: Monitor all authorized child contracts created from your content

### For Users:

1. **Browse Content**: Explore content published by artists
2. **Request Permission**: Submit reuse requests for specific content
3. **Receive Authorization**: Upon approval, receive a child contract granting usage rights
4. **Create Derivatives**: Use authorized content while maintaining traceability

### Technical Flow:

```
User → Wallet Connection → DApp UI
                            ↓
                    Smart Contract Factory
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
      Content Contracts              IPFS Storage
              ↓                           ↓
      Child Contracts                CID Hashes
              ↓                           ↓
      BSC Testnet ←──── Verification ────┘
```

## Project Structure

```
tempDapp/
├── src/                    # React/TypeScript source code
│   ├── components/         # UI components
│   ├── contracts/          # Smart contract ABIs
│   └── utils/              # Helper functions
├── android/                # Android mobile build
├── public/                 # Static assets
├── cypress/                # E2E testing
├── resources/              # App resources (icons, splash screens)
├── dist/                   # Production build output
├── Content.json            # Content contract ABI
├── ChildContent.json       # Child contract ABI
├── Factory.json            # Factory contract ABI
├── capacitor.config.ts     # Capacitor configuration (mobile)
├── vite.config.ts          # Vite build configuration
├── package.json            # Dependencies
├── PresentazioneTesi.pdf   # Thesis presentation
└── README.md               # This file
```

## Use Cases

### Protecting Original Artwork
Artists upload their digital art to IPFS, create protective smart contracts, and maintain full control over derivative works and licensing.

### Authenticating Video Content
Content creators register videos on-chain to prove authenticity and combat deepfake distribution.

### Music Licensing & Remixes
Musicians can authorize remixes and derivative works while maintaining traceability and copyright protection.

### Photography Rights Management
Photographers protect their images and grant specific usage rights through on-chain permissions.

## Technologies Used

- **Blockchain**: Binance Smart Chain (BSC) Testnet
- **Smart Contracts**: Solidity, Truffle Framework
- **Frontend**: TypeScript, React, Ionic
- **Wallet Integration**: WalletConnect, MetaMask
- **Decentralized Storage**: IPFS (InterPlanetary File System)
- **Smart Contract Interaction**: Wagmi hooks, ethers.js
- **Build Tool**: Vite
- **Mobile Framework**: Capacitor
- **Testing**: Cypress (E2E), Ganache (local blockchain)s

This project originated from a university internship focused on creating blockchain-based solutions for digital rights management and content protection.

## Running the Application

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MetaMask or compatible Web3 wallet
- Binance Smart Chain Testnet configuration

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run on Android
npx cap sync android
npx cap open android
```

### Configuration

1. **Configure MetaMask**:
   - Add BSC Testnet network
   - Request testnet BNB from faucet (for gas fees)

2. **Update Contract Addresses**:
   - Deploy Factory contract on BSC Testnet
   - Update contract addresses in application config

## Security Considerations

- Smart contracts are deployed on testnet for development purposes
- Gas fees are required for all write operations (using testnet BNB)
- Private keys should never be shared or committed to version control
- IPFS content is publicly accessible but cryptographically verified

## Future Enhancements

Potential improvements and extensions:
- Mainnet deployment for production use
- Enhanced royalty mechanisms and automated payments
- Integration with NFT standards (ERC-721, ERC-1155)
- AI-powered deepfake detection algorithms
- Multi-chain support (Ethereum, Polygon, etc.)
- Advanced content verification tools
- Collaborative editing and version control
- Reputation system for artists and users

## License

Academic project developed for educational purposes.