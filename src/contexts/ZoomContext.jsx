import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from 'reactflow';

const ZoomContext = createContext();

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};

export const ZoomProvider = ({ children }) => {
  const zoom = useStore((state) => state.transform[2]) || 1;

  return (
    <ZoomContext.Provider value={zoom}>
      {children}
    </ZoomContext.Provider>
  );
};

// Hook to get zoom from ReactFlow store
export const useReactFlowZoom = () => {
  const zoom = useStore((state) => state.transform[2]);
  return zoom || 1;
}; 