import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

export function useWarmUpBrowser() {
  useEffect(() => {
    // Warm up browser for faster OAuth flow
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}
