interface Ethereum {
    isMetaMask?: boolean;
    request?: (args: { method: string; params?: Array<any> }) => Promise<any>;
    on?: (eventName: string, callback: (...args: any[]) => void) => void;
    // Aggiungi qui altri metodi e proprietà se necessario
  }
  
  interface Window {
    ethereum?: Ethereum;
    web3?: {
      currentProvider: Ethereum;
    };
  }