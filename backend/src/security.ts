import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './app';
export type AuthedRequest=Request & {user?:{id:string;name:string;email:string;role:'USER'|'ADMIN'}};
export async function auth(req:AuthedRequest,res:Response,next:NextFunction){try{const cookie=req.headers.cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith('support_token='));const token=cookie?.slice('support_token='.length);if(!token)return res.status(401).json({error:'Authentication required'});const payload=jwt.verify(token,process.env.JWT_SECRET!) as jwt.JwtPayload;if(typeof payload.sub!=='string')throw new Error();const user=await prisma.user.findUnique({where:{id:payload.sub},select:{id:true,name:true,email:true,role:true}});if(!user)return res.status(401).json({error:'Authentication required'});req.user=user as AuthedRequest['user'];next()}catch{return res.status(401).json({error:'Invalid or expired session'})}}
