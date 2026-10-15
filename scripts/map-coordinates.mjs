const res = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/PRY.geo.json');
const geo = await res.json();
const ring = geo.features[0].geometry.coordinates[0];
const xs = ring.map(p=>p[0]), ys = ring.map(p=>p[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
for(const [name,lon,lat] of [['Asunción',-57.63,-25.29],['Ciudad del Este',-54.62,-25.51],['Encarnación',-55.87,-27.33],['Concepción',-57.43,-23.41],['Coronel Oviedo',-56.45,-25.45],['Filadelfia',-60.03,-22.35]]) {
  console.log(JSON.stringify({name,x:((lon-minX)/(maxX-minX)*350+35)/420*100,y:((maxY-lat)/(maxY-minY)*420+30)/480*100}));
}
