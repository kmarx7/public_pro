import type {ReqStatus} from "@/lib/domain";
export const labels:Record<string,string>={satisfied:"충족",partial:"부분 충족",missing:"누락",needs_review:"검토 필요",not_applicable:"해당 없음",ready:"준비됨",processing:"분석 중",error:"오류",reviewing:"검토 중",preparing:"준비 중",complete:"완료",critical:"Critical",major:"Major",minor:"Minor"};
export function Badge({value}:{value:string}){return <span className={`badge ${value}`}>{labels[value]??value}</span>}
export function Header({title,description,action}:{title:string;description?:string;action?:React.ReactNode}){return <header className="pageHeader"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</header>}
export const statuses:ReqStatus[]=["satisfied","partial","missing","needs_review","not_applicable"];
