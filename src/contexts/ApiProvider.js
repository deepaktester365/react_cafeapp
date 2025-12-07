import { createContext, useContext } from 'react';
import CafeAppApiClient from "../CafeAppApiClient";

const ApiContext = createContext();

export default function ApiProvider({children}) {
  const api = new CafeAppApiClient();

  return (
    <ApiContext.Provider value={api}>
     {children}
    </ApiContext.Provider>
  );
}


export function useApi() {
  return useContext(ApiContext);
}
