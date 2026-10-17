import test from 'node:test';
import assert from 'node:assert/strict';
import {renderGps} from '../public/tracking.js';
test('GPS público solo dibuja coordenadas recientes válidas y distingue señal antigua',()=>{
 const now=Date.now(),position={latitude:-25.3,longitude:-57.6,measuredAt:new Date(now).toISOString()};
 const html=renderGps({status:'FRESH',position},now);assert.match(html,/iframe/);assert.match(html,/Vehículo de este bulto/);assert.doesNotMatch(html,/vehicleId|deviceId|token|apiKey/);
 assert.match(renderGps({status:'STALE',position},now),/sin actualización reciente/);
 assert.equal(renderGps({status:'INACTIVE',position},now),'');
 for(const changed of [{latitude:91},{longitude:Infinity},{measuredAt:new Date(now-600001).toISOString()},{measuredAt:'<script>bad</script>'},{latitude:'0" onload="alert(1)'}])assert.doesNotMatch(renderGps({status:'FRESH',position:{...position,...changed}},now),/iframe/);
 assert.doesNotMatch(renderGps({status:'NO_POSITION',position:null},now),/iframe/);
});
