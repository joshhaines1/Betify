// contexts/GroupsRefreshContext.tsx
import React, { createContext, useContext, useRef } from "react";

type GroupsRefreshContextType = {
  markGroupsStale: () => void;
  consumeStaleFlag: () => boolean; // returns true if stale, then resets it
};

const GroupsRefreshContext = createContext<GroupsRefreshContextType | null>(null);

export function GroupsRefreshProvider({ children }: { children: React.ReactNode }) {
  const isStale = useRef(false);

  const markGroupsStale = () => {
    isStale.current = true;
  };

  const consumeStaleFlag = () => {
    const wasStale = isStale.current;
    isStale.current = false;
    return wasStale;
  };

  return (
    <GroupsRefreshContext.Provider value={{ markGroupsStale, consumeStaleFlag }}>
      {children}
    </GroupsRefreshContext.Provider>
  );
}

export function useGroupsRefresh() {
  const ctx = useContext(GroupsRefreshContext);
  if (!ctx) throw new Error("useGroupsRefresh must be used within GroupsRefreshProvider");
  return ctx;
}