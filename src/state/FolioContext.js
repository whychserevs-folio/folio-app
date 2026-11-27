import { createContext, useContext } from "react";

// App-wide state and actions, provided by App.js and read by each screen.
// This is a stepping stone: screens no longer live inside App.js, and each
// one lists exactly which pieces of state it uses. Later these can be split
// into focused hooks (useLibrary, usePreorders, ...) without touching screens.
export const FolioContext = createContext(null);

export function useFolio() {
  const value = useContext(FolioContext);
  if (!value) {
    throw new Error("useFolio must be used inside <FolioContext.Provider>");
  }
  return value;
}
