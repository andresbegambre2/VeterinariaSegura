const {test,beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
let handler;
const calls=[];
const configPath=require.resolve('../src/config/database');
require.cache[configPath]={id:configPath,filename:configPath,loaded:true,exports:{consultar:async(sql,args=[])=>{calls.push({sql,args});return handler(sql,args);}}};
process.env.JWT_SECRET='test-only-secret-with-more-than-thirty-two-characters';
const users=require('../src/services/usuarios.service');
const jwt=require('../src/utils/jwt.util');
const auth=require('../src/middlewares/auth.middleware');
const owner=require('../src/middlewares/propiedad.middleware');
const vet=path.resolve(__dirname,'..').includes('Veterinaria');
const publicRole=vet?'propietario':'paciente';
function response(){return {code:200,body:null,status(c){this.code=c;return this;},json(b){this.body=b;return this;}};}
beforeEach(()=>{calls.length=0;handler=async()=>({rows:[]});});
test('consulta de identidad parametriza entradas sin concatenarlas',async()=>{
 const malicious="x' OR 1=1 --";
 await users.obtenerUsuarioPorEmail(malicious);
 assert.deepEqual(calls[0].args,[malicious]);
 assert.ok(!calls[0].sql.includes(malicious));
});
test('registro público ignora rol privilegiado y almacena bcrypt',async()=>{
 handler=async()=>({rows:[{id:'10',rol:publicRole}]});
 await users.crearUsuario({nombre:'Prueba',email:'test@example.com',password:'Password123!',rol:'administrador'});
 assert.equal(calls[0].args[3],publicRole);
 assert.match(calls[0].args[2],/^\$2[aby]\$/);
});
test('JWT usa identidad y rol vigentes de PostgreSQL',async()=>{
 handler=async()=>({rows:[{id:'9007199254740993',email:'a@example.com',rol:publicRole,activo:true}]});
 const token=jwt.generarToken({id:'9007199254740993',email:'old@example.com',rol:'administrador'});
 const req={get:()=>`Bearer ${token}`}; const res=response();let passed=false;
 await auth(req,res,()=>{passed=true;});
 assert.ok(passed);assert.equal(req.usuario.rol,publicRole);assert.equal(req.usuario.id,'9007199254740993');
});
test('JWT de usuario eliminado se rechaza',async()=>{
 const token=jwt.generarToken({id:'42',email:'a@example.com',rol:publicRole});
 const res=response();await auth({get:()=>`Bearer ${token}`},res,()=>assert.fail('Acceso indebido'));
 assert.equal(res.code,401);
});
test('cuenta deshabilitada no obtiene acceso',async()=>{
 handler=async()=>({rows:[{id:'42',rol:publicRole,activo:false}]});
 const token=jwt.generarToken({id:'42',email:'a@example.com',rol:publicRole});
 const res=response();await auth({get:()=>`Bearer ${token}`},res,()=>assert.fail('Acceso indebido'));
 assert.equal(res.code,403);
});
test('BOLA rechaza una cita ajena con IDs bigint',async()=>{
 if(vet){
  require('../src/services/citas.service').getById=async()=>({id:'1',mascotaId:'8',veterinarioId:'7'});
  require('../src/services/propietarios.service').getByUsuarioId=async()=>({id:'9007199254740993'});
  require('../src/services/mascotas.service').getById=async()=>({id:'8',propietarioId:'9007199254740994'});
 } else {
  require('../src/services/citas.service').obtenerCitaPorId=async()=>({id:'1',pacienteId:'9007199254740994'});
  require('../src/services/pacientes.service').obtenerPacientePorUsuarioId=async()=>({id:'9007199254740993'});
 }
 const res=response();await owner.autorizarAccesoCita({usuario:{id:'42',rol:publicRole},params:{id:'1'}},res,()=>assert.fail('Acceso ajeno'));
 assert.equal(res.code,403);
});
test('BOLA acepta un perfil propio aunque cambie el tipo del ID',async()=>{
 if(vet){
  require('../src/services/citas.service').getById=async()=>({id:'1',mascotaId:'8'});
  require('../src/services/propietarios.service').getByUsuarioId=async()=>({id:'12'});
  require('../src/services/mascotas.service').getById=async()=>({id:'8',propietarioId:12});
 }else{
  require('../src/services/citas.service').obtenerCitaPorId=async()=>({id:'1',pacienteId:12});
  require('../src/services/pacientes.service').obtenerPacientePorUsuarioId=async()=>({id:'12'});
 }
 let passed=false;await owner.autorizarAccesoCita({usuario:{id:'42',rol:publicRole},params:{id:'1'}},response(),()=>{passed=true;});assert.ok(passed);
});
test('errores SQL de unicidad y FK se traducen sin filtrar detalles',()=>{
 const mod=vet?require('../src/middlewares/errors'):require('../src/middlewares/errores.middleware');
 const handle=mod.errorHandler||mod.manejarError;
 for(const code of ['23505','23503']){const res=response();handle({code,message:'SQL SECRET'},null,res,()=>{});assert.equal(res.code,409);assert.ok(!res.body.mensaje.includes('SECRET'));}
});
test('controlador espera consultas async antes de serializar',async()=>{
 if(!vet){
  require('../src/services/especialidades.service').obtenerEspecialidades=async()=>[{id:'1'}];
  const res=response();await require('../src/controllers/especialidades.controller').obtenerEspecialidades({},res,error=>{throw error;});
  assert.deepEqual(res.body,[{id:'1'}]);return;
 }
 const controller=require('../src/controllers/crud.controller')({getAll:async()=>[{id:'1'}]});
 const res=response();await controller.getAll({},res);assert.deepEqual(res.body,[{id:'1'}]);
});

test('cambio de estado no permite reabrir una cita terminal',async()=>{
 const citas=require('../src/services/citas.service');
 handler=async(sql)=> sql.includes('UPDATE') ? {rows:[]} : {rows:[{id:'1',estado:'atendida'}]};
 if(vet){
  delete require.cache[require.resolve('../src/services/citas.service')];
  const service=require('../src/services/citas.service');
  await assert.rejects(service.updateEstado('1','programada'),{status:409});
 }else{
  assert.equal(await citas.actualizarEstadoCita('1','programada'),null);
 }
});

test('HTTP conserva API Key, JWT, RBAC y serialización async',{skip:process.env.RUN_HTTP_TESTS!=='1'},async()=>{
 process.env.API_KEY_POSTMAN='unit-only-api-key-postman';
 process.env.API_KEY_ADMIN='unit-only-api-key-admin';
 process.env.API_KEY_MOVIL='unit-only-api-key-disabled';
 const request=require('supertest');
 const app=require('../src/app');
 const endpoint=vet?'/api/veterinarios':'/api/especialidades';
 handler=async()=>({rows:[{id:'42',rol:publicRole,activo:true,email:'a@example.com'}]});
 const token=jwt.generarToken({id:'42',email:'a@example.com',rol:publicRole});
 const missing=await request(app).get(endpoint);assert.ok([401,403].includes(missing.status));
 assert.equal((await request(app).get(endpoint).set('X-API-Key',process.env.API_KEY_POSTMAN)).status,401);
 const read=await request(app).get(endpoint).set('X-API-Key',process.env.API_KEY_POSTMAN).set('Authorization',`Bearer ${token}`);
 assert.equal(read.status,200);assert.ok(Array.isArray(read.body));
 const denied=await request(app).post(endpoint).set('X-API-Key',process.env.API_KEY_POSTMAN).set('Authorization',`Bearer ${token}`).send({nombre:'No autorizado'});
 assert.equal(denied.status,403);
});

test('Express monta todas las rutas y sus dependencias migradas',()=>{
 process.env.API_KEY_POSTMAN='test-postman';process.env.API_KEY_ADMIN='test-admin';process.env.API_KEY_MOVIL='test-mobile';
 const app=require('../src/app');assert.equal(typeof app,'function');
});
