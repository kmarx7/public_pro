"use client";
import {createContext,useContext,useEffect,useState} from "react";
import {demo} from "@/lib/demo";
import type {DocType,Project,ReqStatus,Workspace} from "@/lib/domain";
const C=createContext<null|(Workspace&{createProject:(v:Omit<Project,"id"|"status"|"updatedAt">)=>Project;addDocument:(p:string,f:File,t:DocType)=>void;addProposal:(p:string,f:File)=>void;setReq:(id:string,s:ReqStatus)=>void;resolve:(id:string)=>void})>(null);
export function Provider({children}:{children:React.ReactNode}){const [d,setD]=useState(demo);const [ready,setReady]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>{try{const v=localStorage.getItem("procureai-v2");if(v)setD(JSON.parse(v))}catch{}setReady(true)},0);return()=>clearTimeout(t)},[]);
 useEffect(()=>{if(ready)localStorage.setItem("procureai-v2",JSON.stringify(d))},[d,ready]);
 const value={...d,createProject(v:Omit<Project,"id"|"status"|"updatedAt">){const p={...v,id:`project-${Date.now()}`,status:"preparing" as const,updatedAt:new Date().toISOString()};setD(x=>({...x,projects:[p,...x.projects]}));return p},addDocument(p:string,f:File,t:DocType){const id=`doc-${Date.now()}`;setD(x=>({...x,documents:[...x.documents,{id,projectId:p,name:f.name,type:t,pages:1,status:"ready",uploadedAt:new Date().toISOString(),text:"Demo adapter: Supabase 연결 후 서버에서 페이지별 텍스트를 추출합니다."}]}))},addProposal(p:string,f:File){setD(x=>({...x,proposals:[{id:`prop-${Date.now()}`,projectId:p,filename:f.name,pages:1,sections:1,status:"ready",updatedAt:new Date().toISOString()},...x.proposals.filter(y=>y.projectId!==p)]}))},setReq(id:string,s:ReqStatus){setD(x=>({...x,requirements:x.requirements.map(r=>r.id===id?{...r,status:s}:r)}))},resolve(id:string){setD(x=>({...x,issues:x.issues.map(i=>i.id===id?{...i,status:"resolved"}:i)}))}};return <C.Provider value={value}>{children}</C.Provider>}
export const useWorkspace=()=>{const v=useContext(C);if(!v)throw new Error("Provider missing");return v};
