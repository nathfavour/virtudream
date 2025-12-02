import React, { createContext, useContext, useRef, useEffect } from 'react';
import { WorldEntity } from './worldTypes';

interface GravityState {
  portals: WorldEntity[];
}

const GravityContext = createContext<React.MutableRefObject<GravityState>>({ current: { portals: [] } });

export const GravityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gravityRef = useRef<GravityState>({ portals: [] });
  return <GravityContext.Provider value={gravityRef}>{children}</GravityContext.Provider>;
};

export const useGravity = () => useContext(GravityContext);

