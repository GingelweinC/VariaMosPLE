import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export interface ConnectingContextValue {
  currentRelationType: Record<string, any> | null;
  setCurrentRelationType: (relationType: Record<string, any> | null) => void;
  currentEndpointType: Record<string, any> | null;
  setCurrentEndpointType: (endpointType: Record<string, any> | null) => void;
}

export const ConnectingContext = createContext<ConnectingContextValue | null>(
  null,
);

export function ConnectingContextProvider({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  const [currentRelationType, setCurrentRelationType] = useState<Record<
    string,
    any
  > | null>(null);
  const [currentEndpointType, setCurrentEndpointType] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    if (currentEndpointType !== null) setCurrentRelationType(null);
  }, [currentEndpointType]);

  return (
    <ConnectingContext.Provider
      value={{
        currentRelationType,
        setCurrentRelationType,
        currentEndpointType,
        setCurrentEndpointType,
      }}
    >
      {children}
    </ConnectingContext.Provider>
  );
}

export function useConnectionContext(): ConnectingContextValue {
  const context = useContext(ConnectingContext);
  if (!context) {
    throw new Error(
      "useConnectionContext must be used within a <ConnectingContextProvider>",
    );
  }
  return context;
}
