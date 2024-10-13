import './ExploreContainer.css';
import ConnectButton from './ConnectButton';
import Component from './Component';

import {
  IonItem
} from '@ionic/react';

interface ContainerProps { }

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <>
      <IonItem><ConnectButton/></IonItem>
      <Component/>
    </>
  );
};

export default ExploreContainer;
