import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import {Web3ReactProvider} from '@web3-react/core';
import {Web3Provider} from "@ethersproject/providers";
import './index.css';
import App from './App';
import AddressesContext, {Addresses} from './components/AddressesContext';

const getLibrary = provider => {
  return new Web3Provider(provider);
}

ReactDOM.render(
  <BrowserRouter>
    <Web3ReactProvider getLibrary={getLibrary}>
      <AddressesContext.Provider value={Addresses}>
        <App />
      </AddressesContext.Provider>
    </Web3ReactProvider>
  </BrowserRouter>, 
  document.getElementById('root')
);