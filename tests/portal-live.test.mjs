import test from 'node:test';
import assert from 'node:assert/strict';
import {shipmentStatus,summary,readDashboard,escapeHtml,normalize} from '../public/portal-live.js';

test('real parcel states determine totals and partial delivery',()=>{
  const shipment=(...states)=>({parcels:states.map(state=>({state}))});
  assert.equal(shipmentStatus(shipment('DELIVERED','IN_TRANSIT')).label,'Entrega parcial');
  assert.equal(shipmentStatus(shipment('RETURN_PENDING','DELIVERED')).label,'Con devolución');
  assert.equal(shipmentStatus(shipment()).label,'Sin bultos registrados');
  assert.deepEqual(summary([shipment('DELIVERED'),shipment('DELIVERED','IN_TRANSIT'),shipment()]),{total:3,delivered:1,inTransit:1});
  assert.equal(normalize('Encarnación'),'encarnacion');
  assert.equal(escapeHtml('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});
test('dashboard refuses mismatched companies and propagates backend failures',async()=>{
  await assert.rejects(readDashboard({rpc:async()=>({data:{company:{id:'other'},shipments:[],documents:[],requests:[]}})},'own'),/Invalid/);
  await assert.rejects(readDashboard({rpc:async()=>({error:Error('offline')})},'own'),/offline/);
});

