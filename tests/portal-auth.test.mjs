import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {readPortalAccess, validateConfig, googleOAuthUrl} from '../public/portal-auth.js';

const config={supabaseUrl:'https://pnaqjenemmfydetkpokk.supabase.co',publishableKey:'sb_publishable_test',loginOrigin:'https://nexoralogistic.com.py'};
function clientFor({session=true,user={id:'user-a',email:'client@example.com'},member=null,company=null,sessionError=null,userError=null,memberError=null,companyError=null,sessionId='user-a'}={}) {
  const calls=[];
  return {
    calls,
    auth:{
      getSession:async()=>({data:{session:session?{user:{id:sessionId}}:null},error:sessionError}),
      getUser:async()=>({data:{user},error:userError}),
    },
    from(table){return {select(){return this;},eq(column,value){calls.push({table,column,value});return this;},async maybeSingle(){return table==='portal_memberships'?{data:member,error:memberError}:{data:company,error:companyError};}};},
  };
}
const member={user_id:'user-a',company_id:'company-a',status:'active'};
const company={id:'company-a',name:'Cliente A',active:true};

test('signed-out visitors never query customer data',async()=>{
  const client=clientFor({session:false});
  assert.deepEqual(await readPortalAccess(client),{kind:'signed-out'});
  assert.equal(client.calls.length,0);
});
test('a stored session must match the user verified by Supabase',async()=>{
  const client=clientFor({sessionId:'forged-id'});
  await assert.rejects(readPortalAccess(client),/identity mismatch/);
  assert.equal(client.calls.length,0);
});
test('failed server verification never queries memberships',async()=>{
  const client=clientFor({userError:new Error('expired')});
  await assert.rejects(readPortalAccess(client),/verify session/);
  assert.equal(client.calls.length,0);
});
test('Google identity alone is pending; editable metadata cannot grant access',async()=>{
  const client=clientFor({user:{id:'user-a',user_metadata:{role:'admin',company_id:'company-b'}}});
  assert.equal((await readPortalAccess(client)).kind,'pending');
  assert.deepEqual(client.calls,[{table:'portal_memberships',column:'user_id',value:'user-a'}]);
});
test('suspended members cannot query company data',async()=>{
  const client=clientFor({member:{...member,status:'suspended'},company});
  assert.equal((await readPortalAccess(client)).kind,'suspended');
  assert.equal(client.calls.length,1);
});
test('active members see only the verified assigned company',async()=>{
  const client=clientFor({member,company});
  const result=await readPortalAccess(client);
  assert.equal(result.kind,'active');
  assert.equal(result.company.name,'Cliente A');
  assert.deepEqual(client.calls,[{table:'portal_memberships',column:'user_id',value:'user-a'},{table:'portal_companies',column:'id',value:'company-a'}]);
});
test('missing or inactive companies pause access',async()=>{
  for(const candidate of [null,{...company,active:false}]) assert.equal((await readPortalAccess(clientFor({member,company:candidate}))).kind,'suspended');
});
test('mismatched membership or company identity fails closed',async()=>{
  await assert.rejects(readPortalAccess(clientFor({member:{...member,user_id:'user-b'}})),/Membership identity/);
  await assert.rejects(readPortalAccess(clientFor({member,company:{...company,id:'company-b'}})),/Company identity/);
});
test('database failures never become an active or pending account',async()=>{
  await assert.rejects(readPortalAccess(clientFor({memberError:new Error('offline')})),/offline/);
  await assert.rejects(readPortalAccess(clientFor({member,companyError:new Error('denied')})),/denied/);
});
test('configuration accepts only public publishable keys and HTTPS origins',()=>{
  assert.equal(validateConfig(config).supabaseUrl,config.supabaseUrl);
  for(const changed of [{publishableKey:'sb_secret_test'},{publishableKey:'legacy-jwt'},{supabaseUrl:'http://api.example.com'},{loginOrigin:'https://example.com/path'},{loginOrigin:'https://user:pass@example.com'}]) assert.throws(()=>validateConfig({...config,...changed}));
});
test('real SDK creates a Google OAuth URL with PKCE and the fixed portal callback',async()=>{
  const values=new Map();
  const client=createClient(config.supabaseUrl,config.publishableKey,{auth:{flowType:'pkce',autoRefreshToken:false,detectSessionInUrl:false,storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}}});
  const callback='https://nexoralogistic.com.py/clientes/';
  const url=new URL(await googleOAuthUrl(client,callback,config.supabaseUrl));
  assert.equal(url.searchParams.get('provider'),'google');
  assert.equal(url.searchParams.get('redirect_to'),callback);
  assert.equal(url.searchParams.get('code_challenge_method'),'s256');
  assert.ok(url.searchParams.get('code_challenge'));
  assert.equal(url.searchParams.get('prompt'),'select_account');
  await client.auth.stopAutoRefresh();
});
test('OAuth cannot navigate to an unexpected server',async()=>{
  const client={auth:{signInWithOAuth:async()=>({data:{url:'https://evil.example.com/auth/v1/authorize'},error:null})}};
  await assert.rejects(googleOAuthUrl(client,'https://nexoralogistic.com.py/clientes/',config.supabaseUrl),/Unexpected/);
});
