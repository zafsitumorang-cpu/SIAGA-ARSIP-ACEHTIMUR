import crypto from 'node:crypto';
import {fail} from './security.mjs';

const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

// Called inside the store transaction, so parallel requests share the same committed receipt.
export function requestReceipt(req,userId,operation,values){
  const key=req.headers['idempotency-key'];
  if(key===undefined)return null; // Existing API clients remain compatible.
  if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{16,128}$/.test(key))fail(422,'Kunci pengulangan permintaan tidak valid.');
  return {keyHash:digest(JSON.stringify([userId,operation,key])),bodyHash:digest(JSON.stringify(values))};
}

export function matchesReceipt(stored,request){
  if(!request||stored?.keyHash!==request.keyHash)return false;
  if(stored.bodyHash!==request.bodyHash)fail(409,'Permintaan ini sudah dipakai untuk data berbeda. Periksa arsip yang tersimpan.');
  return true;
}
