import React, { useEffect, useState } from 'react';
import { useReadContract, useSendTransaction, useAccount } from 'wagmi';
import Web3 from 'web3';
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { MemoryBlockstore } from 'blockstore-core';
import {
  IonItem,  
  IonLabel,
  IonButton,
  IonList,
  IonInput,
  IonAlert,
  IonCol,
  IonGrid,
  IonRow,
  IonCheckbox,
  IonText
} from '@ionic/react';
import { abi as FactoryAbi } from '../../Factory_.json';
import { abi as ContentAbi } from '../../Content.json';
import '../theme/variables.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.always.css';
import '@ionic/react/css/palettes/dark.class.css';
import '@ionic/react/css/palettes/dark.system.css';
import { config } from '../config';

interface Request {
  EA: string;
  thisContract: string;
  state: string;
}

interface Child {
  childOwner: string;
  childAddress: string;
  parentArtist: string;
  parentContract: string;
}

export default function Component() {
  const { address, isConnecting, isDisconnected } = useAccount(); // indirizzo dell'utente attuale e stato della connessione
  const [file, setFile] = useState<File | null>(null);  // file selezionato dall'utente per l'upload su IPFS
  const { sendTransaction } = useSendTransaction()  // hook per inviare transazioni
  const factoryAddress = "0x80aa76DC05408Aa8d7974faE40420696a501be47";  // indirizzo del contratto factory
  //0x6950DA530644130b1151B75F1C08Fc88e58080a2 - Indirizzo del contratto factory senza struttura Child
  //0xA6d15fCb436f944EAdf08FE5c5E40fd761C5f6dC - Indirizzo del contratto factory con struttura Child incompleta
  //0xfe025dD853635a2275714118d10F23a3d5c1b88A - Indirizzo del contratto factory con struttura Child completa ma senza require sui metodi external
  const [showHidden, setShowHidden] = useState(true); // checkbox per mostrare i contratti nascosti (con richieste inviate o congelati)
  const [showFrozen, setShowFrozen] = useState(true); // checkbox per mostrare i contratti congelati
  const [showActive, setShowActive] = useState(true); // checkbox per mostrare i contratti attivi
  const [showReceivedReqWaiting, setShowReceivedReqWaiting] = useState(true); // checkbox per mostrare le richieste ricevute in attesa
  const [showReceivedReqAccepted, setShowReceivedReqAccepted] = useState(true); // checkbox per mostrare le richieste ricevute accettate
  const [showReceivedReqDenied, setShowReceivedReqDenied] = useState(true); // checkbox per mostrare le richieste ricevute rifiutate
  const [showSentReqWaiting, setShowSentReqWaiting] = useState(true); // checkbox per mostrare le richieste inviate in attesa
  const [showSentReqAccepted, setShowSentReqAccepted] = useState(true); // checkbox per mostrare le richieste inviate accettate
  const [showSentReqDenied, setShowSentReqDenied] = useState(true);   // checkbox per mostrare le richieste inviate rifiutate
  const maxContract = 10;  // numero massimo di contratti che un artista può pubblicare
  const listenerProv = new Web3("wss://bsc-testnet-rpc.publicnode.com");  // provider per ascoltare gli eventi della blockchain
  const factory = new listenerProv.eth.Contract(FactoryAbi as any, factoryAddress); // contratto factory
  const [subscription, setSubscription] = useState<any>(null);  // sottoscrizione agli eventi del contratto
  const [loading, setLoading] = useState<boolean>(false);  // caricamento dei dati dalla blockchain
  const [alert, setAlert] = useState({ isOpen: false, backdropDismiss: true, header: '', message: '' });  // alert per messaggi di errore o conferma
  const [fontSize, setFontSize] = useState(19);
  const [state, setState] = useState({  // stato dell'applicazione, contiene i dati della blockchain
    isRegistered: false,  // flag che indica se l'utente è registrato come artista
    contractAddresses: [] as string[],  // lista degli indirizzi dei contratti pubblicati dagli artisti
    myContract: [] as string[], // lista degli indirizzi dei contratti pubblicati dall'utente attuale
    requestReceived: [] as Request[], // lista delle richieste ricevute dall'utente attuale
    requestSent: [] as Request[], // lista delle richieste inviate dall'utente attuale
    childContract: [] as Child[],  // lista degli indirizzi dei contratti figli ottenuti dall'utente attuale
    myChild: [] as Child[],  // lista degli indirizzi dei contratti figli concessi dall'utente attuale
    myFreezedContracts: [] as string[], // lista degli indirizzi dei contratti congelati dall'utente attuale
    freezedContracts: [] as string[], // lista degli indirizzi dei contratti congelati
  });

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      // Definisci la dimensione minima e massima del font
      const minFontSize = 13; // Dimensione minima del font
      const maxFontSize = 19; // Dimensione massima del font
      const minScreenWidth = 300; // Schermo minimo di riferimento
      const maxScreenWidth = 1200; // Schermo massimo di riferimento

      // Calcola la dimensione del font dinamicamente in base alla larghezza dello schermo
      if (screenWidth < minScreenWidth) {
        setFontSize(minFontSize); // Usa la dimensione minima sotto i 380px
      } else if (screenWidth > maxScreenWidth) {
        setFontSize(maxFontSize); // Usa la dimensione massima sopra i 1200px
      } else {
        // Calcola una dimensione del font proporzionale tra i valori min e max
        const dynamicFontSize = ((screenWidth - minScreenWidth) / (maxScreenWidth - minScreenWidth)) * (maxFontSize - minFontSize) + minFontSize;
        console.log('Dynamic font size:', dynamicFontSize);
        setFontSize(dynamicFontSize);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // chiama la funzione una volta per impostare la dimensione iniziale
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logsFilter = {  // filtro per gli eventi del contratto
    address: factoryAddress, // indirizzo del contratto di cui ascoltare gli eventi
  };

  function handleLogs(log: any) { // funzione che gestisce i dati ricevuti dagli eventi del contratto
    console.log("New log received:", log);

    if(log.topics[0] == "0x2ba4761022e57f025b35d7b95731d12707ded82df74e5aa84c26088acf79bb31"){  // gestisco l'evento ArtistAdded
      console.log("Registered as artist:", (listenerProv as any).utils.toChecksumAddress("0x"+log.topics[1].slice(26)));  // connverto il dato del log dell'evento in indirizzo
      if(log.topics[1] == "0x000000000000000000000000" + (address as string).slice(2).toLowerCase()){  // se l'artista aggiunto è l'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Registered as artist', message: address as string });
        setState((prevState) => ({
          ...prevState,
          isRegistered: true, // registro l'utente come artista
        }));
      }
    }else if(log.topics[0] == "0xe9c49900341feac9a9b55ba8ebbd191df0c23420283b242961485e20862d282f"){  // gestisco l'evento DeployedContracts
      const checksumAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1)); // estraggo dal log dell'evento l'indirizzo del contratto e lo converto
      console.log("New contract address:", checksumAddress);
      if(log.topics[1] == "0x000000000000000000000000" + (address as string).slice(2).toLowerCase()){ // se il contratto è stato creato dall'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Contract deployed: ', message: 'Your contract is created with address:\n' + checksumAddress });
        setState((prevState) => {
          if (!prevState.myContract.includes(checksumAddress)) {  // se l'indirizzo del contratto non è già presente nella lista
            return {
              ...prevState,
              myContract: [...prevState.myContract, checksumAddress], // aggiungo l'indirizzo del contratto alla lista dei contratti dell'utente attuale
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      } else{  // se il contratto è stato creato da un altro artista
        setState((prevState) => {
          if(!prevState.contractAddresses.includes(checksumAddress)) {  // se l'indirizzo del contratto non è già presente nella lista
            return {
              ...prevState,
              contractAddresses: [...prevState.contractAddresses, checksumAddress], // aggiungo l'indirizzo del contratto alla lista dei contratti pubblicati dagli artisti
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }
    }else if(log.topics[0] == "0x8c6a18ab335626f1347dafba8a4583f9f7a0ca277339118a93194718b4eb3ae7"){  // gestisco l'evento FreezedContract
      const checksumAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1));
      console.log("Contract freezed:", checksumAddress);
      if(log.topics[1] == "0x000000000000000000000000" + (address as string).slice(2).toLowerCase()){  // se il contratto appartiene all'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Contract freezed', message: 'Your contract with address:\n' + checksumAddress + " is freezed" });
        setState((prevState) => {
          if(!prevState.myFreezedContracts.includes(checksumAddress)){  // se l'indirizzo del contratto non è già presente nella lista
            return {
              ...prevState,
              myFreezedContracts: [...prevState.myFreezedContracts, checksumAddress], // aggiungo l'indirizzo del contratto alla lista dei contratti congelati dall'utente attuale
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }else{
        setState((prevState) => {
          if(!prevState.freezedContracts.includes(checksumAddress)){  // se l'indirizzo del contratto non è già presente nella lista
            return {
              ...prevState,
              freezedContracts: [...prevState.freezedContracts, checksumAddress], // aggiungo l'indirizzo del contratto alla lista dei contratti congelati
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }
    }else if(log.topics[0] == "0xfe85a440eeb955db02cb6a979383619bf804fb3a73ecadfc54b024a40294a12a"){  // gestisco l'evento Request
      const senderAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1));
      const contractAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 2));
      const ownerAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 3));
      console.log("New request:\nSender address:", senderAddress + "\nContract address:", contractAddress + "\nOwner address:", ownerAddress);
      if(senderAddress == address){ // se il mittente della richiesta è l'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request sent', message: 'Request sent to contract with address:\n' + contractAddress });
        setState((prevState) => {
          const exists = prevState.requestSent.some(request => request.thisContract === contractAddress && request.EA === senderAddress && request.state === '1'); 
          if(!exists){  // se la richiesta non è già presente nella lista
            return {
              ...prevState,
              requestSent: [...prevState.requestSent, {EA: senderAddress, thisContract: contractAddress, state: '1'}],  // aggiungo la richiesta alla lista delle richieste inviate dall'utente attuale
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }else if (ownerAddress == address){ // se il proprietario del contratto è l'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request received', message: 'Request received from:\n' + senderAddress + '\nFor contract:\n' + contractAddress });
        setState((prevState) => {
          const exists = prevState.requestReceived.some(request => request.EA === senderAddress && request.thisContract === contractAddress && request.state === '1');
          if(!exists){  // se la richiesta non è già presente nella lista
            return {
              ...prevState,
              requestReceived: [...prevState.requestReceived, {EA: senderAddress, thisContract: contractAddress, state: '1'}],  // aggiungo la richiesta alla lista delle richieste ricevute dall'utente attuale
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }
    }else if(log.topics[0] == "0x628c4880b53f1496025c5f723fc821f89099460e355ce3c0931359aac587cf2c"){  // gestisco l'evento GrantedPerm
      const senderAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1));
      const contractAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 2));
      const ownerAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 3));
      console.log("Grented permission:\nRequest sender address:", senderAddress + "\nContract address:", contractAddress + "\nOwner address:", ownerAddress);
      if(senderAddress == address){ // se il mittente della richiesta è l'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request accepted', message: 'Request to:\n' + contractAddress + ' has been accepted' });
        setState((prevState) => ({
          ...prevState,
          requestSent: prevState.requestSent.map(request => request.thisContract == contractAddress ? {...request, state: '2'} : request),  // aggiorno lo stato della richiesta
        }));
      }else if (ownerAddress == address){
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request accepted', message: 'Request of:\n' + senderAddress + ' has been accepted for contract:\n' + contractAddress });
        setState((prevState) => ({
          ...prevState,
          requestReceived: prevState.requestReceived.map(request => request.EA == senderAddress && request.thisContract == contractAddress ? {...request, state: '2'} : request), // aggiorno lo stato della richiesta
        }));
      }
    }else if(log.topics[0] == "0x35f84ed5e450eee1d89b1d166b3baab3794b7e3ac503420a5867e646bea15460"){  // gestisco l'evento ChildCreated
      const childOwner = (listenerProv as any).utils.toChecksumAddress("0x" + log.topics[1].slice(26));
      const childContract = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1));
      const parentArtist = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 2));
      const parentContract = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 3));
      const newChild = {childOwner: childOwner, childAddress: childContract, parentArtist: parentArtist, parentContract: parentContract};
      console.log("New child contract:\nChild owner:", childOwner + "\nChild contract:", childContract + "\nParent artist:", parentArtist + "\nParent contract:", parentContract);
      if(childOwner == address){    // se il contratto figlio è stato concesso all'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Child contract created', message: 'Child contract:\n' + childContract + '\nCreated by:\n' + parentArtist + '\nFor parent contract:\n' + parentContract });
        setState((prevState) => {
          const exists = prevState.childContract.some(contract => contract.childAddress === newChild.childAddress);
          if(!exists){ // se l'indirizzo del contratto figlio non è già presente nella lista
            return {
              ...prevState, 
              childContract: [...prevState.childContract, newChild], // aggiungo l'indirizzo del contratto figlio alla lista dei contratti figli ottenuti dall'utente attuale
            };
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          } 
        });
      }else if(parentArtist == address){  // se il contratto figlio è stato concesso dall'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Child contract granted', message: 'Child contract ' + childContract + ' granted to ' + childOwner + ' for parent contract ' + parentContract });
        setState((prevState) => {
          const exists = prevState.myChild.some(contract => contract.childAddress === newChild.childAddress);
          if(!exists){ // se l'indirizzo del contratto figlio non è già presente nella lista
            return {  
              ...prevState,
              myChild: [...prevState.myChild, newChild], // aggiungo l'indirizzo del contratto figlio alla lista dei contratti figli concessi dall'utente attuale
            };  
          } else {
            return prevState; // altrimenti restituisco lo stato precedente
          }
        });
      }
    }else if(log.topics[0] == "0x953cb4783cd5322bf15c0f2577e860930d47665ef24ccb64d27669e92077ecf6"){  // gestisco l'evento DeniedPerm
      const senderAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 1));
      const contractAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 2));
      const ownerAddress = (listenerProv as any).utils.toChecksumAddress(extractAddress(log.data, 3));
      console.log("Denied permission:\nRequest sender address:", senderAddress + "\nContract address:", contractAddress + "\nOwner address:", ownerAddress);
      if(senderAddress == address){ // se il mittente della richiesta è l'utente attuale
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request denied', message: 'Request to ' + contractAddress + ' has been denied' });
        setState((prevState) => ({
          ...prevState,
          requestSent: prevState.requestSent.map(request => request.thisContract == contractAddress ? {...request, state: '3'} : request),  // aggiorno lo stato della richiesta
        }));
      }else if (ownerAddress == address){
        setAlert({ isOpen: true, backdropDismiss: true, header: 'Request denied', message: 'Request of ' + senderAddress + ' has been denied for contract ' + contractAddress });
        setState((prevState) => ({
          ...prevState,
          requestReceived: prevState.requestReceived.map(request => request.EA == senderAddress && request.thisContract == contractAddress ? {...request, state: '3'} : request), // aggiorno lo stato della richiesta
        }));
      }
    }
  }

  function extractAddress(hexString: string, pos: number): string {      
    // estraggo l'indirizzo dalla stringa hex
    const addressHex = hexString.slice(2 + 64*pos, 2 + 64 + 64*pos);
  
    // aggiungi il prefisso "0x" e tolgo i caratteri in eccesso
    const address = '0x'+`${addressHex}`.slice(24);
  
    return address;
  }

  function handleError(error: any) {  // funzione che gestisce gli errori
    console.error("Error when subscribing to new logs:", error);
  }

  useEffect(() => { // hook che si attiva quando cambia l'indirizzo dell'account
    if (address) { // se l'account è connesso
      async function subscribeToLogs() {  // funzione che si occupa di sottoscriversi agli eventi del contratto
        try {
          // creo una nuova sottoscrizione ai logs delle transazioni del contratto, in modo da ricevere gli eventi
          const newSubscription = await listenerProv.eth.subscribe('logs', logsFilter);

          console.log(`Subscription created with ID: ${newSubscription.id}`);

          newSubscription.on("data", handleLogs); // gestisco i dati ricevuti
          newSubscription.on("error", handleError); // gestisco gli errori
          setSubscription(newSubscription);
        } catch (error) {
          console.error(`Error subscribing to new logs: ${error}`);
        }
      }
      
      subscribeToLogs();

      return () => {  // alla disconnessione dell'account
        if (subscription) {
          console.log(`Unsubscribing from subscription with ID: ${subscription.id}`);
          subscription.unsubscribe();
        }
      };
    }
  }, [address]);  // ricarico la sottoscrizione quando cambia l'indirizzo dell'account


  // funzioni per interagire con il contratto
  const { data: isReg } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getIsArtist',  // funzione del contratto che restituisce se l'utente è registrato come artista
    args: [address],
  });

  const { data: contractAddressesList } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getContracts', // funzione del contratto che restituisce la lista degli indirizzi dei contratti pubblicati dagli artisti
  });

  const { data: myContracts } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getArtistContracts', // funzione del contratto che restituisce la lista degli indirizzi dei contratti pubblicati dall'utente attuale
    args: [address],
  });

  const filteredContractAddressesList = (contractAddressesList as string[])?.filter((address: string) => !(myContracts as string[])?.includes(address));
  
  const { data: receivedReq } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getArtistRequestsReceived',  // funzione del contratto che restituisce la lista delle richieste ricevute dall'utente attuale
    args: [address],
  });

  const { data: sentReq } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getArtistRequestsSent', // funzione del contratto che restituisce la lista delle richieste inviate dall'utente attuale 
    args: [address],
  });

  const { data: childContracts } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getChildContractsObtained',  // funzione del contratto che restituisce la lista degli indirizzi dei contratti figli ottenuti dall'utente attuale
    args: [address],
  });

  const { data: myChildContracts } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getChildContractsGiven', // funzione del contratto che restituisce la lista degli indirizzi dei contratti figli concessi dall'utente attuale
    args: [address],
  });

  const { data: freezedMyContracts } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getArtistFreezedContracts',  // funzione del contratto che restituisce la lista degli indirizzi dei contratti congelati dall'utente attuale
    args: [address],
  });

  const { data: freezedContractsList } = useReadContract({
    abi: FactoryAbi,
    address: factoryAddress,
    functionName: 'getFreezedContracts',  // funzione del contratto che restituisce la lista degli indirizzi dei contratti congelati
  });

  useEffect(() => {
    const loadBlockchainData = async () => {
      setLoading(true); // inizio del caricamento

      // carico i dati dalla blockchain
      if (isReg !== undefined && contractAddressesList !== undefined && myContracts !== undefined && receivedReq !== undefined && sentReq !== undefined && childContracts !== undefined && myChildContracts !== undefined && freezedMyContracts !== undefined && freezedContractsList !== undefined) {
        try {
          setState((prevState) => ({
            ...prevState,
            isRegistered: isReg as boolean,
          }));

          setState((prevState) => ({
            ...prevState,
            contractAddresses: filteredContractAddressesList as string[], 
          }));

          setState((prevState) => ({
            ...prevState,
            myContract: myContracts as string[],
          }));

          setState((prevState) => ({
            ...prevState,
            requestReceived: receivedReq as Request[],
          }));

          setState((prevState) => ({
            ...prevState,
            requestSent: sentReq as Request[],
          }));

          setState((prevState) => ({
            ...prevState,
            childContract: childContracts as Child[],
          }));

          setState((prevState) => ({
            ...prevState,
            myChild: myChildContracts as Child[],
          }));

          setState((prevState) => ({
            ...prevState,
            myFreezedContracts: freezedMyContracts as string[],
          }));

          setState((prevState) => ({
            ...prevState,
            freezedContracts: freezedContractsList as string[],
          }));

        } catch (error) {
          console.error("Error loading blockchain data:", error);
        } finally {
          setLoading(false); // fine del caricamento
        }
      } else {
        console.error('Contract, web3, or address is not available.');
        setLoading(false); // fine del caricamento
      }
    };

    loadBlockchainData();
  }, [isReg, contractAddressesList, myContracts, receivedReq, sentReq, childContracts, myChildContracts, freezedMyContracts, freezedContractsList]);  // ricarico i dati quando cambiano


  // funzioni per interagire con il contratto
  const createContract = async (IPFSHash: string) => {
    try {
      sendTransaction({ ...config, to: factoryAddress, data: factory.methods.createContract(IPFSHash).encodeABI() as '0x${string}' });
    } catch (error) {
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error creating contract' });
      console.error(error);
    }
  };

  const registerArtist = async () => {
    try {
      sendTransaction({ ...config, to: factoryAddress, data: factory.methods.registerArtist().encodeABI() as '0x${string}' });
    } catch (error) {
      console.error("Error registering artist: ", error);
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error registering artist' });
    }
  };

  const requestPermission = async (contentAddress: string) => {
    if (!listenerProv) {
      console.error('Web3 is not available.');
      return;
    }
    try {
      const contentContract = new listenerProv.eth.Contract(ContentAbi as any, contentAddress);
      sendTransaction({ ...config, to: contentAddress as '0x${string}', data: contentContract.methods.request().encodeABI() as '0x${string}' });
    } catch (error) {
      console.error("Error sending request: ", error);
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error sending request' });
    }
  };

  const grantPerm = async (request: Request) => {
    if (!listenerProv) {
      console.error('Web3 is not available.');
      return;
    }
    try {
      const contentContract = new listenerProv.eth.Contract(ContentAbi as any, request.thisContract);
      sendTransaction({ ...config, to: request.thisContract as '0x${string}', data: contentContract.methods.reply(true, request.EA).encodeABI() as '0x${string}' });
    } catch (error) {
      console.error("Error accepting request: ", error);
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error accepting request' });
    }
  };

  const denyPerm = async (request: Request) => {
    if (!listenerProv) {
      console.error('Web3 is not available.');
      return;
    }
    try {
      const contentContract = new listenerProv.eth.Contract(ContentAbi as any, request.thisContract);
      sendTransaction({ ...config, to: request.thisContract as '0x${string}', data: contentContract.methods.reply(false, request.EA).encodeABI() as '0x${string}' });
    } catch (error) {
      console.error("Error denying request: ", error);
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error denying request' });
    }
  };

  const freeze = async (contractAddress: string) => {
    if (!listenerProv) {
      console.error('Web3 is not available.');
      return;
    }
    try {
      const contentContract = new listenerProv.eth.Contract(ContentAbi as any, contractAddress);
      sendTransaction({ ...config, to: contractAddress as '0x${string}', data: contentContract.methods.freezeContract().encodeABI() as '0x${string}' });
    } catch (error) {
      console.error("Error freezing contract: ", error);
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'Error freezing contract' });
    }
  };

  // funzioni per l'upload su IPFS
  async function createHeliaNode() {
    const blockstore = new MemoryBlockstore();  // crea un blockstore in memoria
  
    const helia = await createHelia({ blockstore });  // crea un nodo Helia con il blockstore in memoria
  
    const fs = unixfs(helia); // crea un filesystem UnixFS
  
    return { helia, fs }; // restituisci il nodo Helia e il filesystem UnixFS
  }
  
  async function uploadToIPFS(file: File) {
    const { fs } = await createHeliaNode(); // crea un nodo Helia e un filesystem UnixFS
  
    const fileArrayBuffer = await file.arrayBuffer(); // leggi il file come ArrayBuffer
    const fileBytes = new Uint8Array(fileArrayBuffer);  // converti l'ArrayBuffer in Uint8Array
  
    const cid = await fs.addBytes(fileBytes); // aggiungi il file al filesystem UnixFS e ottieni il CID
  
    console.log('File caricato con successo. CID:', cid.toString());
  
    return cid.toString();  // restituisci il CID in formato stringa
  }

  const handleUpload = async () => {
    if (!file) {  // se non è stato selezionato alcun file
      setAlert({ isOpen: true, backdropDismiss: true, header: 'Error', message: 'You need to select a file' });
      return;
    }

    console.log(file.name);
    const cid = await uploadToIPFS(file); // carica il file su IPFS e ottieni il CID
    if (cid) {  // se il CID è stato ottenuto
      setState((prevState) => ({
        ...prevState,
        IPFSHash: cid,  // aggiorna lo stato con il CID del file  
      }));
      createContract(cid);  // crea un contratto con il CID del file
      setAlert({ isOpen: true, backdropDismiss: true, header: 'File uploaded', message: 'CID: '+ cid });
    }
  };

  // funzioni per gestire gli eventi dei checkbox e dei file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);
    } else {
      console.error('Nessun file selezionato.');
    }
  };

  const handleCheckboxChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowHidden(e.detail.checked);
  };

  const handleFrozenChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowFrozen(e.detail.checked);
  };
  
  const handleActiveChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowActive(e.detail.checked);
  };

  const handleReceivedReqWaitingChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowReceivedReqWaiting(e.detail.checked);
  };

  const handleReceivedReqAcceptedChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowReceivedReqAccepted(e.detail.checked);
  }

  const handleReceivedReqDeniedChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowReceivedReqDenied(e.detail.checked);
  }

  const handleSentReqWaitingChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowSentReqWaiting(e.detail.checked);
  }

  const handleSentReqAcceptedChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowSentReqAccepted(e.detail.checked);
  }

  const handleSentReqDeniedChange = (e: CustomEvent<{ checked: boolean }>) => {
    setShowSentReqDenied(e.detail.checked);
  }

  const filteredContractAddresses = state.contractAddresses.filter((address) => { // filtro per visualizzare gli elementi in base al checkbox
    const isRequestSent = state.requestSent.some(request => request.thisContract === address);  // condizione per visualizzare l'elemento in base al checkbox
    const isContractFreezed = state.freezedContracts.includes(address); // condizione per visualizzare l'elemento in base al checkbox

    // dondizione per visualizzare l'elemento in base al checkbox
    if (!showHidden && (isRequestSent || isContractFreezed)) {
      return false; // non visualizzare contratti con richieste inviate o congelati se checkbox è false
    }

    return true;  // visualizza tutti gli elementi se checkbox è true
  });

  const filteredMyContracts = state.myContract.filter((address) => {  // filtro per visualizzare gli elementi in base al checkbox
    const isFrozen = state.myFreezedContracts.includes(address);  // condizione per visualizzare l'elemento in base al checkbox
    if (showFrozen && isFrozen) return true;  // visualizza contratti congelati se checkbox è true
    if (showActive && !isFrozen) return true; // visualizza contratti attivi se checkbox è true
    return false; // non visualizzare contratti congelati se checkbox è false
  });

  const filteredReqReceived = state.requestReceived.filter((request) => { // filtro per visualizzare gli elementi in base al checkbox
    if (showReceivedReqAccepted && request.state == '2') return true; // mostra richieste accettate
    if (showReceivedReqDenied && request.state == '3') return true; // mostra richieste rifiutate
    if (showReceivedReqWaiting && request.state == '1') return true; // mostra comunque richieste in sospeso
    return false;
  });

  const filteredReqSent = state.requestSent.filter((request) => { // filtro per visualizzare gli elementi in base al checkbox
    if (showSentReqAccepted && request.state == '2') return true; // mostra richieste accettate
    if (showSentReqDenied && request.state == '3') return true; // mostra richieste rifiutate
    if (showSentReqWaiting && request.state == '1') return true; // mostra comunque richieste in sospeso
    return false;
  });

  if (isConnecting) return <div id="container"><IonAlert
                                                  isOpen={isConnecting}
                                                  backdropDismiss={true}
                                                  header="Connecting"
                                                  message="Connection to the wallet in progress..."
                                                /></div>;
  if (isDisconnected) return <div id="container"><IonAlert
                                                  isOpen={isDisconnected}
                                                  backdropDismiss={true}
                                                  header="Disconnected"
                                                  message="Disconnected from the wallet"
                                                /></div>;
  if (loading) return <div id="container"><IonAlert
                                              isOpen={loading}
                                              backdropDismiss={false}
                                              header="Loading"
                                              message="Please wait while we load the contract..."
                                            /></div>;  

  return (
    <>
      <IonAlert
        isOpen={alert.isOpen}
        backdropDismiss={alert.backdropDismiss}
        header={alert.header}
        message={alert.message}
        onDidDismiss={() => setAlert({ ...alert, isOpen: false })} // chiude l'alert al dismiss
      />
      {state.isRegistered ? (
        <>
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonLabel><IonText style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Artist Account: </IonText><a href="">{address}</a></IonLabel>
          </IonItem>
          {state.myContract.length < maxContract ? (
            <>
              <IonItem style={{ fontSize: `${fontSize}px` }}>
                <IonButton onClick={() => document.getElementById('fileInput')?.click()}>Scegli file</IonButton>
                <IonInput
                  id="fileName"
                  value={file ? file.name : 'Nessun file selezionato'}
                  readonly
                />
                <input
                  id="fileInput"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </IonItem>
              <IonItem><IonButton onClick={handleUpload}>Pubblica contratto</IonButton></IonItem>
            </>
          ) : (
            <IonItem style={{ fontSize: `${fontSize}px` }}>
              <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Numero massimo di contratti raggiunto</IonLabel>
            </IonItem>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>I miei contratti</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showFrozen} onIonChange={handleFrozenChange}>Contratti congelati</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showActive} onIonChange={handleActiveChange}>Contratti attivi</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredMyContracts.length === 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {filteredMyContracts.map((address, index) => (
                <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                  <IonLabel>
                    <a href="#">{address}</a>
                    <br/>
                    {state.myFreezedContracts.includes(address) ? (
                      <IonLabel>Contratto congelato</IonLabel>
                    ) : (
                      <IonButton onClick={() => freeze(address)}>Congela</IonButton>
                    )}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Richieste ricevute</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showReceivedReqWaiting} onIonChange={handleReceivedReqWaitingChange}>Richieste in attesa</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showReceivedReqAccepted} onIonChange={handleReceivedReqAcceptedChange}>Richieste accettate</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showReceivedReqDenied} onIonChange={handleReceivedReqDeniedChange}>Richieste rifiutate</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredReqReceived.length === 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {filteredReqReceived.map((request, index) => (
                <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                  <IonLabel>
                    Account:<br/><a href="#">{request.EA}</a><br />
                    Contratto:<br/><a href="#">{request.thisContract}</a>
                    <br />
                    {request.state == '1' ? (
                      <>
                        <IonButton onClick={() => grantPerm(request)}>Accetta</IonButton>
                        <IonButton onClick={() => denyPerm(request)}>Rifiuta</IonButton>
                      </>
                    ) : request.state == '2' ? (
                      <IonLabel>Richiesta accettata</IonLabel>
                    ) : request.state == '3' ? (
                      <IonLabel>Richiesta rifiutata</IonLabel>
                    ) : (
                      <IonLabel>Stato sconosciuto</IonLabel>
                    )}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Contratti figlio concessi</IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {state.myChild.length == 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {state.myChild.map((child, index) => (
                <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                  <IonLabel>
                    Indirizzo figlio:<br/><a href="">{child.childAddress}</a> <br/> Concesso a:<br/><a href="">{child.childOwner}</a> <br/> Per il contratto:<br/><a href="">{child.parentContract}</a>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Contratti a cui poter fare richiesta</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showHidden} onIonChange={handleCheckboxChange}>Visualizza nascosti</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredContractAddresses.length === 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {filteredContractAddresses.map((address, index) => (
                  <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                    {state.requestSent.some(request => request.thisContract === address) ? (
                      <IonLabel>
                        <a href="">{address}</a> <br /> Richiesta già inviata per questo contratto
                      </IonLabel>
                    ) : state.freezedContracts.includes(address) ? (
                      <IonLabel>
                        <a href="">{address}</a> <br /> Contratto congelato
                      </IonLabel>
                    ) : (
                      <IonLabel>
                        <a href="">{address}</a> <br />
                        <IonButton onClick={() => requestPermission(address)}>Richiedi permesso</IonButton>
                      </IonLabel>
                    )}
                  </IonItem>
                ))}
            </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Richieste inviate</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqWaiting} onIonChange={handleSentReqWaitingChange}>Richieste in attesa</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqAccepted} onIonChange={handleSentReqAcceptedChange}>Richieste accettate</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqDenied} onIonChange={handleSentReqDeniedChange}>Richieste rifiutate</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredReqSent.length == 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
            {filteredReqSent.map((request, index) => (
              <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                <IonLabel>
                  Contratto richiesto: <br/>  <a href="">{request.thisContract}</a> <br/>
                  {request.state == '1' ? "Richiesta inviata" : request.state == '2' ? "Richiesta accettata" : request.state == '3' ? "Richiesta rifiutata" : "Stato sconosciuto"}<br/>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Contratti figlio ottenuti</IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {state.childContract.length == 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {state.childContract.map((child, index) => (
                <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                  <IonLabel>
                    Indirizzo figlio:<br/><a href="">{child.childAddress}</a> <br /> Concesso da:<br/><a href="">{child.parentArtist}</a> <br /> Per il contratto:<br/><a href="">{child.parentContract}</a>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </>
      ) : (
        <>
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonLabel><IonText style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Regular Account: </IonText><a href="">{address}</a></IonLabel>
          </IonItem>
          <IonItem><IonButton onClick={registerArtist}>Diventa un artista</IonButton></IonItem>
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Contratti a cui poter fare richiesta</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showHidden} onIonChange={handleCheckboxChange}>Visualizza nascosti</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredContractAddresses.length === 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {filteredContractAddresses.map((address, index) => (
                  <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                    {state.requestSent.some(request => request.thisContract === address) ? (
                      <IonLabel>
                        <a href="">{address}</a> <br /> Richiesta già inviata per questo contratto
                      </IonLabel>
                    ) : state.freezedContracts.includes(address) ? (
                      <IonLabel>
                        <a href="">{address}</a> <br /> Contratto congelato
                      </IonLabel>
                    ) : (
                      <IonLabel>
                        <a href="">{address}</a> <br />
                        <IonButton onClick={() => requestPermission(address)}>Richiedi permesso</IonButton>
                      </IonLabel>
                    )}
                  </IonItem>
                ))}
            </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Richieste inviate</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqWaiting} onIonChange={handleSentReqWaitingChange}>Richieste in attesa</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqAccepted} onIonChange={handleSentReqAcceptedChange}>Richieste accettate</IonCheckbox>
                </IonCol>
                <IonCol>
                  <IonCheckbox justify="start" checked={showSentReqDenied} onIonChange={handleSentReqDeniedChange}>Richieste rifiutate</IonCheckbox>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {filteredReqSent.length == 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
            {filteredReqSent.map((request, index) => (
              <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                <IonLabel>
                  Contratto richiesto: <br/>  <a href="">{request.thisContract}</a> <br/>
                  {request.state == '1' ? "Richiesta inviata" : request.state == '2' ? "Richiesta accettata" : request.state == '3' ? "Richiesta rifiutata" : "Stato sconosciuto"}<br/>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          )}
          <IonItem style={{ fontSize: `${fontSize}px` }}>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Contratti figlio ottenuti</IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonItem>
          {state.childContract.length == 0 ? (
            <IonItem style={{ fontSize: `${fontSize}px` }}><IonLabel>Lista vuota</IonLabel></IonItem>
          ) : (
            <IonList>
              {state.childContract.map((child, index) => (
                <IonItem key={index} style={{ fontSize: `${fontSize}px` }}>
                  <IonLabel>
                    Indirizzo figlio:<br/><a href="">{child.childAddress}</a> <br /> Concesso da:<br/><a href="">{child.parentArtist}</a> <br /> Per il contratto:<br/><a href="">{child.parentContract}</a>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </>
      )
      }
    </>
  );
}