import { useState, useCallback, useRef, useEffect } from 'react';
import { ProgressUpdate } from '../types/generation';

// Derive WebSocket URL from current host so it works through proxied domains
const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const useWebSocket = () => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((jobId: string) => {
    const ws = new WebSocket(`${getWsBaseUrl()}/${jobId}`);

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Check if it's an error message
      if (data.type === 'error') {
        setError(data.error);
        setConnected(false);
      } else {
        // It's a progress update
        const update: ProgressUpdate = data;
        setProgress(update);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnected(false);
      setProgress(null);
      setError(null);
    }
  }, []);

  const cancelJob = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('cancel');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { progress, connected, error, connect, disconnect, cancelJob };
};
