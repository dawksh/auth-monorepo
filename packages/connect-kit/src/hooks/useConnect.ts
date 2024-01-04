import { useCallback, useEffect, useState } from "react";
import { ConnectError } from "@farcaster/connect";
import QRCode from "qrcode";
import { useAppClient } from "./useAppClient";

export interface UseConnectArgs {
  siweUri: string;
  domain: string;
  nonce?: string | (() => Promise<string>);
  notBefore?: string;
  expirationTime?: string;
  requestId?: string;
}

export function useConnect({ siweUri, domain, nonce, notBefore, expirationTime, requestId }: UseConnectArgs) {
  const appClient = useAppClient();

  const [qrCodeUri, setqrCodeUri] = useState<string>();
  const [channelToken, setChannelToken] = useState<string>();
  const [connectUri, setconnectUri] = useState<string>();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<ConnectError>();

  const resetState = async () => {
    setChannelToken(undefined);
    setIsError(false);
    setIsSuccess(false);
    setError(undefined);
  };

  const connect = useCallback(async () => {
    if (appClient && !channelToken) {
      const {
        data,
        isError: isConnectError,
        error: connectError,
      } = await appClient.connect({
        nonce: typeof nonce === "function" ? await nonce() : nonce,
        siweUri,
        domain,
        notBefore,
        expirationTime,
        requestId,
      });
      if (isConnectError) {
        console.error(connectError);
        setIsError(true);
        setError(connectError);
      } else {
        setChannelToken(data.channelToken);
        setconnectUri(data.connectUri);
        setIsSuccess(true);
      }
    }
  }, [appClient, channelToken, siweUri, domain, nonce, notBefore, expirationTime, requestId]);

  const reconnect = useCallback(async () => {
    await resetState();
    connect();
  }, [connect]);

  const generateQRCode = useCallback(async () => {
    if (connectUri) {
      const qrCode = await QRCode.toDataURL(connectUri);
      setqrCodeUri(qrCode);
    }
  }, [connectUri]);

  useEffect(() => {
    if (connectUri) {
      generateQRCode();
    }
  }, [connectUri, generateQRCode]);

  return {
    connect,
    reconnect,
    isSuccess,
    isError,
    error,
    data: { channelToken, connectUri, qrCodeUri },
  };
}

export default useConnect;