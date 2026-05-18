import { useState, useCallback } from 'react';
import { verifyCertificate } from '../services/certificateApi';

export const useVerifyCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('cert_verification_history');
    return saved ? JSON.parse(saved) : [];
  });

  const verify = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await verifyCertificate(formData);
      setResult(response);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        vin: formData.vehicleId,
        status: response.status,
        result: response
      };
      
      const newHistory = [historyEntry, ...history].slice(0, 50); // Keep last 50
      setHistory(newHistory);
      localStorage.setItem('cert_verification_history', JSON.stringify(newHistory));
      
      return response;
    } catch (err) {
      setError(err);
      
      // Add failed attempt to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        vin: formData.vehicleId,
        status: 'FAILED',
        error: err
      };
      
      const newHistory = [historyEntry, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('cert_verification_history', JSON.stringify(newHistory));
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cert_verification_history');
  };

  return {
    verify,
    isLoading,
    result,
    error,
    history,
    clearHistory
  };
};
