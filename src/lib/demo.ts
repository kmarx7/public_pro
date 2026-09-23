import type { Workspace } from "./domain";

export const projectId="culture-ai-platform";
export const demo:Workspace={
 projects:[{id:projectId,name:"AI 기반 문화관광 통합 플랫폼 구축",agency:"○○시",noticeNumber:"2026-12345",deadline:"2026-10-31",status:"reviewing",updatedAt:"2026-09-23T09:30:00+09:00"}],
 documents:[
  {id:"rfp",projectId,name:"제안요청서.pdf",type:"rfp",pages:68,status:"ready",uploadedAt:"2026-09-22",text:"5.3 보안\n개인정보 저장 시 AES-256 이상의 암호화를 적용하여야 한다.\n\n4.2 성능 요구사항\n평균 응답시간은 3초 이하이어야 한다."},
  {id:"sow",projectId,name:"과업지시서.pdf",type:"statement_of_work",pages:34,status:"ready",uploadedAt:"2026-09-22",text:"장애 발생 시 30분 이내 대응할 수 있는 운영체계를 구축한다."},
  {id:"eval",projectId,name:"평가기준.pdf",type:"evaluation_criteria",pages:12,status:"ready",uploadedAt:"2026-09-22",text:"기능 적합성, 성능, 보안 및 운영 계획을 평가한다."},
  {id:"notice",projectId,name:"입찰공고.pdf",type:"notice",pages:8,status:"ready",uploadedAt:"2026-09-22",text:"공고번호 2026-12345 / 제안서 제출 마감 2026년 10월 31일"}],
 requirements:[
  {id:"func1",projectId,code:"REQ-FUNC-001",category:"FUNC",text:"생성형 AI 기반 질의응답 기능 제공",mandatory:true,documentId:"rfp",page:31,section:"4.1 서비스 기능",proposalSection:"4.1 AI 관광 안내 서비스",matchedText:"생성형 AI를 활용한 관광정보 질의응답 기능을 제공한다.",status:"satisfied",reason:"요구한 기능과 적용 방식이 명시적으로 확인됨."},
  {id:"func2",projectId,code:"REQ-FUNC-002",category:"FUNC",text:"한국어 및 영어 다국어 서비스 제공",mandatory:true,documentId:"rfp",page:32,section:"4.1 서비스 기능",proposalSection:"4.2 다국어 서비스",matchedText:"한국어와 영어를 우선 지원한다.",status:"satisfied",reason:"한국어와 영어 지원 범위가 모두 확인됨."},
  {id:"perf1",projectId,code:"REQ-PERF-001",category:"PERF",text:"평균 응답시간 3초 이하",mandatory:true,documentId:"rfp",page:38,section:"4.2 성능 요구사항",proposalSection:"6.1 성능 최적화",matchedText:"빠른 응답 속도를 보장한다.",status:"partial",reason:"빠른 응답은 언급되었으나 평균 3초 이하라는 정량 조건이 없음."},
  {id:"sec1",projectId,code:"REQ-SEC-001",category:"SEC",text:"개인정보 저장 시 AES-256 이상의 암호화 적용",mandatory:true,documentId:"rfp",page:45,section:"5.3 보안",proposalSection:"8.2 데이터 보호",matchedText:"개인정보를 안전하게 암호화하여 관리한다.",status:"partial",reason:"암호화는 언급되었으나 AES-256 이상이라는 구체 조건을 확인할 수 없음."},
  {id:"ops1",projectId,code:"REQ-OPS-001",category:"OPS",text:"장애 발생 시 30분 이내 대응체계 구축",mandatory:true,documentId:"sow",page:21,section:"7.2 장애 대응",status:"missing",reason:"장애 대응 시간 또는 30분 이내 대응체계를 찾지 못함."},
  {id:"staff1",projectId,code:"REQ-STAFF-001",category:"STAFF",text:"정보보안 관련 자격을 보유한 담당자 배치",mandatory:false,documentId:"rfp",page:52,section:"6.1 수행 조직",proposalSection:"10. 수행 조직",matchedText:"보안 담당자를 별도 지정한다.",status:"needs_review",reason:"담당자 배치는 확인되나 자격 보유 근거가 없음."}],
 proposals:[{id:"prop",projectId,filename:"기술제안서_v0.8.pdf",pages:126,sections:42,status:"ready",updatedAt:"2026-09-23T09:30:00+09:00"}],
 issues:[
  {id:"i1",projectId,requirementId:"ops1",severity:"critical",title:"필수 장애 대응체계가 누락됨",description:"30분 이내 대응 조직과 절차를 제안서에 명시해야 합니다.",status:"open"},
  {id:"i2",projectId,requirementId:"sec1",severity:"major",title:"암호화 수준 근거 부족",description:"AES-256 이상의 알고리즘 적용 범위와 키 관리 방안을 보완해야 합니다.",status:"open"},
  {id:"i3",projectId,requirementId:"perf1",severity:"major",title:"응답시간 정량 조건 미확인",description:"평균 3초 이하 달성 방법과 검증 기준을 추가해야 합니다.",status:"open"},
  {id:"i4",projectId,requirementId:"staff1",severity:"minor",title:"보안 담당자 자격 확인 필요",description:"투입인력 이력서에서 관련 자격 보유 여부를 확인하세요.",status:"open"}]};
