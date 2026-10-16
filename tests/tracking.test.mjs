import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupOrder,orderStatus,normalizeCode,validCode} from '../public/tracking.js';
test('tracking uses exact codes, handles unknown orders and propagates API failures',async()=>{
 const code='B-0123456789ABCDEF0123',config={supabaseUrl:'https://example.test',publishableKey:'public-key'};
 assert.equal(normalizeCode(' '+code.toLowerCase()+' '),code);assert.ok(validCode(code));assert.ok(!validCode('NXR-DEMO-001'));
 let calls=0;
 const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://example.test/rest/v1/rpc/track_order');assert.deepEqual(JSON.parse(options.body),{p_code:code});assert.equal(options.credentials,'omit');assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>null};};
 assert.equal(await lookupOrder(code,{config,fetcher}),null);assert.equal(calls,1);
 await assert.rejects(lookupOrder('short',{config,fetcher}),/invalid-code/);assert.equal(calls,1);
 await assert.rejects(lookupOrder(code,{config,fetcher:async()=>({ok:false})}),/unavailable/);
 await assert.rejects(lookupOrder(code,{config,fetcher:async()=>({ok:true,json:async()=>({code:'other',counts:{},events:[]})})}),/invalid-response/);
});
test('real parcel counts show partial delivery and return states accurately',()=>{
 assert.equal(orderStatus({EXPECTED:2}),'Pedido registrado');assert.equal(orderStatus({IN_TRANSIT:2}),'En camino');
 assert.equal(orderStatus({DELIVERED:1,IN_TRANSIT:1}),'Entrega parcial');assert.equal(orderStatus({DELIVERED:2}),'Entregado');
 assert.equal(orderStatus({RETURN_PENDING:1,DELIVERED:1}),'Con devolución');assert.equal(orderStatus({}),'Sin estado disponible');
});
