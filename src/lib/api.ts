import { authClient } from "@/lib/auth-client";

const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const apiConfigured = Boolean(base);

export async function apiRequest<T>(path:string, init:RequestInit = {}):Promise<T>{
  if(!base) throw new Error("The BookNook API URL is not configured.");
  const headers=new Headers(init.headers);
  if(init.body&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");
  if(path.startsWith("/borrows")||["POST","PATCH","DELETE"].includes((init.method||"GET").toUpperCase())){
    const {data,error}=await authClient.token();
    if(error||!data?.token)throw new Error("Please sign in again before continuing.");
    headers.set("Authorization",`Bearer ${data.token}`);
  }
  const response=await fetch(`${base}${path}`,{...init,headers,cache:"no-store"});
  if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.message||"The request could not be completed.")}
  if(response.status===204)return undefined as T;
  return response.json() as Promise<T>;
}
