export const supervises=user=>['admin','leader'].includes(user?.role);
export function canUpdateDisposition(user,disposition){
  return supervises(user)||Boolean(disposition.assignedUserId?disposition.assignedUserId===user?.id:user?.subsection&&disposition.assignedSubsection===user.subsection);
}
export function dispositionRecipients(users,archive){
  return users.filter(user=>user.active&&user.subsection===archive.subsection&&!supervises(user)).map(({id,name,subsection})=>({id,name,subsection}));
}
