import { createContext, useContext, useState, ReactNode } from "react";

export interface ConnectingContextValue {
  currentRelationType: Record<string, any> | null;
  setCurrentRelationType: (relationType: Record<string, any> | null) => void;
}

export const ConnectingContext = createContext<ConnectingContextValue | null>(
  null,
);

export function ConnectingContextProvider({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  const [currentRelationType, setCurrentRelationType] = useState<
    Record<string, any> | null
  >(null);

  return (
    <ConnectingContext.Provider
      value={{ currentRelationType, setCurrentRelationType }}
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
