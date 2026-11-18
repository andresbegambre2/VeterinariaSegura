const {test} = require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
test('PostgreSQL real: CRUD, relaciones, roles y persistencia entre conexiones', {skip:process.env.RUN_DB_TESTS!=='1'}, async()=>{
 const db=require('../src/config/database');
 const client=await db.pool.connect();
 const original=db.consultar;
 db.consultar=(sql,args)=>client.query(sql,args);
 const vet=path.resolve(__dirname,'..').includes('Veterinaria');
 const tag=`t${Date.now()}${Math.random().toString(16).slice(2,8)}`;
 try {
  await client.query('BEGIN');
  const users=require('../src/services/usuarios.service');
  const user=await users.crearUsuario({nombre:'Prueba integración',email:`${tag}@example.com`,password:'Password123!'});
  assert.equal(user.rol,vet?'propietario':'paciente');
  assert.equal((await users.verificarCredenciales(user.email,'Password123!')).id,user.id);
  let record,service;
  if(vet){
   const owners=require('../src/services/propietarios.service');
   const owner=await owners.create({nombre:'Persona prueba',documento:tag,correo:`${tag}@example.com`,telefono:'3001234567',usuarioId:user.id});
   service=require('../src/services/mascotas.service');
   record=await service.create({nombre:'Mascota prueba',especie:'perro',raza:'mestizo',edad:2,propietarioId:owner.id});
   assert.equal((await owners.getMascotas(owner.id))[0].id,record.id);
  }else{
   service=require('../src/services/especialidades.service');
   record=await service.crearEspecialidad({nombre:tag,descripcion:'Prueba de integración',activa:true});
   assert.equal((await service.obtenerEspecialidadPorId(record.id)).nombre,tag);
  }
  // Consultas que fallan se aíslan en savepoint para conservar la transacción.
  await client.query('SAVEPOINT duplicate');
  await assert.rejects(client.query(`INSERT INTO public.usuarios(nombre,email,password_hash,rol_id) SELECT nombre,email,password_hash,rol_id FROM public.usuarios WHERE id=$1`,[user.id]),{code:'23505'});
  await client.query('ROLLBACK TO SAVEPOINT duplicate');
  await client.query('SAVEPOINT reference');
  if(vet) await assert.rejects(client.query('DELETE FROM public.propietarios WHERE usuario_id=$1',[user.id]),{code:'23503'});
  else await assert.rejects(client.query('INSERT INTO public.medicos(nombre,registro_medico,email,especialidad_id) VALUES ($1,$2,$3,$4)',['Prueba',tag,`${tag}@example.com`,'9223372036854775807']),{code:'23503'});
  await client.query('ROLLBACK TO SAVEPOINT reference');
  // Comprobar índices reales y RLS; no sustituye pruebas del endpoint Supabase.
  const indexes=(await client.query("SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='citas'")).rows;
  assert.ok(indexes.some(r=>r.indexdef.includes('UNIQUE')&&r.indexdef.includes('estado')));
  const rls=(await client.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.usuarios'::regclass")).rows[0];
  assert.equal(rls.relrowsecurity,true);
  await client.query('ROLLBACK');
  // Prueba de persistencia con registro aislado confirmado, y limpieza explícita.
  const role=vet?'propietario':'paciente';let id;
  try{
   id=(await client.query('INSERT INTO public.usuarios(nombre,email,rol_id) SELECT $1,$2,id FROM public.roles WHERE nombre=$3 RETURNING id',['Persistencia prueba',`${tag}-persist@example.com`,role])).rows[0].id;
   const independent=await db.pool.connect();
   try{assert.equal((await independent.query('SELECT id FROM public.usuarios WHERE id=$1',[id])).rows[0].id,id);}finally{independent.release();}
  }finally{if(id)await client.query('DELETE FROM public.usuarios WHERE id=$1',[id]);}
 } finally {
  await client.query('ROLLBACK');client.release();db.consultar=original;await db.pool.end();
 }
});
