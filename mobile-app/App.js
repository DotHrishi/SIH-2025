import React from 'react';
import { StatusBar } from 'expo-status-bar';
import SimpleApp from './SimpleApp';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <SimpleApp />
    </>
  );
}