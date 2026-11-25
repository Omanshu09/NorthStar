import { EventEmitter } from 'node:events';
import type { Prisma, PrismaClient } from '@prisma/client';
export const events = new EventEmitter();
type TicketEvent = { ticketId:string; actorId:string; action:string; details:Record<string,unknown>; notifyUserId?:string; message?:string; type?:string };
let registered=false;
export function registerEvents(db:PrismaClient){
 if(registered)return; registered=true;
 const handle=async(e:TicketEvent)=>{try{await db.activityLog.create({data:{ticketId:e.ticketId,userId:e.actorId,action:e.action,details:e.details as Prisma.InputJsonValue}});if(e.notifyUserId&&e.message)await db.notification.create({data:{userId:e.notifyUserId,ticketId:e.ticketId,type:e.type||e.action,message:e.message}});if(e.action==='TICKET_CREATED'){const admins=await db.user.findMany({where:{role:'ADMIN'},select:{id:true}});const ticket=await db.ticket.findUnique({where:{id:e.ticketId},select:{title:true}});if(ticket&&admins.length)await db.notification.createMany({data:admins.filter(a=>a.id!==e.actorId).map(a=>({userId:a.id,ticketId:e.ticketId,type:'TICKET_CREATED',message:`New ticket: ${ticket.title}`}))})}if(e.action==='COMMENT_ADDED'&&!e.notifyUserId){const ticket=await db.ticket.findUnique({where:{id:e.ticketId},select:{userId:true}});const admins=await db.user.findMany({where:{role:'ADMIN'},select:{id:true}});const recipients=admins.filter(a=>a.id!==e.actorId);if(ticket&&ticket.userId!==e.actorId&&recipients.length)await db.notification.createMany({data:recipients.map(a=>({userId:a.id,ticketId:e.ticketId,type:'COMMENT_ADDED',message:'A requester added a comment'}))})}}catch(error){console.error('Ticket event handler failed',error)}};
 for(const name of ['TICKET_CREATED','TICKET_UPDATED','TICKET_STATUS_CHANGED','COMMENT_ADDED','TICKET_RESOLVED'])events.on(name,handle);
}
export function publish(name:string,event:TicketEvent){events.emit(name,event)}
