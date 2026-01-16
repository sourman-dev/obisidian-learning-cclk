import { createContext, useContext, ReactNode } from "react";
import { App } from "obsidian";
import CCLKPlugin from "../main";

interface AppContextType {
  app: App;
  plugin: CCLKPlugin;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  app: App;
  plugin: CCLKPlugin;
  children: ReactNode;
}

export function AppProvider({ app, plugin, children }: AppProviderProps) {
  return (
    <AppContext.Provider value={{ app, plugin }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
