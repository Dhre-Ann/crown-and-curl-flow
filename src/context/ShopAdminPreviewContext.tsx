import { createContext, useContext, type ReactNode } from "react";

const CustomerPreviewReadOnlyContext = createContext(false);

export function CustomerPreviewReadOnlyProvider({ children }: { children: ReactNode }) {
  return <CustomerPreviewReadOnlyContext.Provider value={true}>{children}</CustomerPreviewReadOnlyContext.Provider>;
}

export function useCustomerPreviewReadOnly() {
  return useContext(CustomerPreviewReadOnlyContext);
}
