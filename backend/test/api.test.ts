import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';
const db=new PrismaClient();
let userId='',otherId='',adminId='',userCookie='',otherCookie='',adminCookie='',ticketId='';
const password='integration-password-2026';
beforeAll(async()=>{
 process.env.JWT_SECRET='test-only-secret-with-enough-entropy';await db.$connect();
 const hash=await bcrypt.hash(password,4),stamp=Date.now();
 const [user,other,admin]=await Promise.all([
  db.user.create({data:{name:'Test User',email:`api-test-${stamp}@example.com`,password:hash}}),
  db.user.create({data:{name:'Other User',email:`api-other-${stamp}@example.com`,password:hash}}),
  db.user.create({data:{name:'Test Admin',email:`api-admin-${stamp}@example.com`,password:hash,role:'ADMIN'}})
 ]);userId=user.id;otherId=other.id;adminId=admin.id;
 const [a,b,c]=await Promise.all([request(app).post('/api/auth/login').send({email:user.email,password}),request(app).post('/api/auth/login').send({email:other.email,password}),request(app).post('/api/auth/login').send({email:admin.email,password})]);
 userCookie=a.headers['set-cookie'][0];otherCookie=b.headers['set-cookie'][0];adminCookie=c.headers['set-cookie'][0];
});
afterAll(async()=>{if(ticketId)await db.ticket.deleteMany({where:{id:ticketId}});await db.user.deleteMany({where:{id:{in:[userId,otherId,adminId]}}});await db.user.deleteMany({where:{email:{startsWith:'api-test-register-'}}});await db.$disconnect()});
describe('support API',()=>{
 it('exposes health and rejects requests without a session',async()=>{expect((await request(app).get('/health')).status).toBe(200);expect((await request(app).get('/api/tickets')).status).toBe(401)});
 it('creates USER accounts regardless of a supplied role and rejects duplicate email',async()=>{const email=`api-test-register-${Date.now()}@example.com`,body={name:'New User',email,password,role:'ADMIN'};const created=await request(app).post('/api/auth/register').send(body);expect(created.status).toBe(201);expect(created.body.data.role).toBe('USER');expect((await request(app).post('/api/auth/register').send(body)).status).toBe(409)});
 it('blocks regular users from admin APIs',async()=>{expect((await request(app).get('/api/admin/dashboard').set('Cookie',userCookie)).status).toBe(403)});
 it('creates and lists an owned ticket',async()=>{const created=await request(app).post('/api/tickets').set('Cookie',userCookie).send({title:'Cannot access workspace',description:'The sign in screen returns an error after password reset.',category:'Technical Support',priority:'HIGH'});expect(created.status).toBe(201);ticketId=created.body.data.id;const listing=await request(app).get('/api/tickets').set('Cookie',userCookie);expect(listing.body.data.some((t:any)=>t.id===ticketId)).toBe(true)});
 it('hides tickets and blocks edits for other users',async()=>{expect((await request(app).get(`/api/tickets/${ticketId}`).set('Cookie',otherCookie)).status).toBe(404);expect((await request(app).patch(`/api/tickets/${ticketId}`).set('Cookie',otherCookie).send({title:'Changed by stranger'})).status).toBe(404)});
 it('validates ticket data and prevents user status changes',async()=>{expect((await request(app).post('/api/tickets').set('Cookie',userCookie).send({title:'x'})).status).toBe(400);expect((await request(app).patch(`/api/admin/tickets/${ticketId}/status`).set('Cookie',userCookie).send({status:'RESOLVED'})).status).toBe(403)});
 it('allows editing and commenting on an open ticket',async()=>{expect((await request(app).patch(`/api/tickets/${ticketId}`).set('Cookie',userCookie).send({title:'Updated workspace access issue'})).status).toBe(200);const c=await request(app).post(`/api/tickets/${ticketId}/comments`).set('Cookie',userCookie).send({content:'I can reproduce this in another browser.'});expect(c.status).toBe(201);expect(c.body.data.user.id).toBe(userId)});
 it('lets admins manage status and priority and creates activity',async()=>{expect((await request(app).get('/api/admin/dashboard').set('Cookie',adminCookie)).status).toBe(200);expect((await request(app).patch(`/api/admin/tickets/${ticketId}/priority`).set('Cookie',adminCookie).send({priority:'URGENT'})).status).toBe(200);expect((await request(app).patch(`/api/admin/tickets/${ticketId}/status`).set('Cookie',adminCookie).send({status:'IN_PROGRESS'})).status).toBe(200);await new Promise(resolve=>setTimeout(resolve,75));const activity=await request(app).get(`/api/tickets/${ticketId}/activity`).set('Cookie',adminCookie);expect(activity.status).toBe(200);expect(activity.body.data.some((a:any)=>a.action==='TICKET_STATUS_CHANGED')).toBe(true)});
 it('does not allow editing after processing begins',async()=>{expect((await request(app).patch(`/api/tickets/${ticketId}`).set('Cookie',userCookie).send({title:'Cannot change now'})).status).toBe(409)});
});
