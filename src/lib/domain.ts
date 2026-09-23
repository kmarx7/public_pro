export type ReqStatus="satisfied"|"partial"|"missing"|"needs_review"|"not_applicable";
export type DocType="notice"|"rfp"|"statement_of_work"|"specification"|"evaluation_criteria"|"attachment"|"other";
export type Project={id:string;name:string;agency:string;noticeNumber:string;deadline:string;status:"preparing"|"reviewing"|"complete";updatedAt:string};
export type Document={id:string;projectId:string;name:string;type:DocType;pages:number;status:"processing"|"ready"|"error";uploadedAt:string;text:string};
export type Requirement={id:string;projectId:string;code:string;category:string;text:string;mandatory:boolean;documentId:string;page:number;section:string;proposalSection?:string;matchedText?:string;status:ReqStatus;reason:string};
export type Proposal={id:string;projectId:string;filename:string;pages:number;sections:number;status:"processing"|"ready"|"error";updatedAt:string};
export type Issue={id:string;projectId:string;requirementId:string;severity:"critical"|"major"|"minor";title:string;description:string;status:"open"|"resolved"};
export type Workspace={projects:Project[];documents:Document[];requirements:Requirement[];proposals:Proposal[];issues:Issue[]};
