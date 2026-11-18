const {spawnSync}=require('node:child_process');
const path=require('node:path');
process.env.RUN_DB_TESTS='1';
const result=spawnSync(process.execPath,['--test',path.resolve(__dirname,'../test/postgres.integration.test.js')],{stdio:'inherit',env:process.env});
process.exitCode=result.status ?? 1;
