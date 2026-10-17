import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lookupOrder} from '../public/tracking.js';
test('tracking timeout covers connection and JSON read and aborts the request',async()=>{
 const config={supabaseUrl:'https://example.test',publishableKey:'public'};
 let signal;
 await assert.rejects(lookupOrder('B-0123456789ABCDEF0123',{config,timeoutMs:20,fetcher:async(_url,options)=>{signal=options.signal;return {ok:true,json:()=>new Promise(()=>{})};}}),/unavailable/);
 assert.equal(signal.aborted,true);
});
test('deployed headers deny framing and scripts from third parties but permit the tracking map/API',()=>{
 const headers=readFileSync(new URL('../public/_headers',import.meta.url),'utf8');
 assert.match(headers,/X-Frame-Options: DENY/);assert.match(headers,/frame-ancestors 'none'/);assert.match(headers,/script-src 'self';/);assert.match(headers,/frame-src https:\/\/www.openstreetmap.org/);assert.match(headers,/connect-src[^;]+pnaqjenemmfydetkpokk.supabase.co/);
});
