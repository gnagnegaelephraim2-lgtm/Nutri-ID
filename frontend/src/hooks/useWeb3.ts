import { useState, useCallback } from 'react';
import { connectWallet, type Web3State } from '@/lib/web3';

const DISCONNECTED_STATE: Web3State = {
  provider: null,
  signer: null,
  userAddress: null,
  chainId: null,
  isConnected: false,
  addresses: null,
  healthIDContract: null,
};

export function useWeb3() {
  const [state, setState] = useState<Web3State>(DISCONNECTED_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const s = await connectWallet();
      setState(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setState(DISCONNECTED_STATE);
    setError(null);
  }, []);

  return { ...state, error, isConnecting, connect, disconnect };
}
