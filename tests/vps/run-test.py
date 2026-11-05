import subprocess,pathlib,json,sys,os,time,hashlib,urllib.request,stat
case=sys.argv[1] if len(sys.argv)>1 else 'success'
if case not in ['success','rollback','missing-file']:raise ValueError('Unknown test scenario')
root=pathlib.Path('/fixture-state');root.mkdir(exist_ok=True)
subprocess.run(['git','clone','/fixture/remote.git','/opt/siaga-arsip'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
subprocess.run(['git','-C','/opt/siaga-arsip','checkout','--detach','a12e258'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
pathlib.Path('/var/lib/siaga-arsip').mkdir()
pathlib.Path('/etc/systemd/system/siaga-arsip.service').write_text('[Unit]\nDescription=Legacy fixture\n[Service]\nWorkingDirectory=/opt/siaga-arsip\nExecStart=/usr/local/bin/node /opt/siaga-arsip/app.mjs\n[Install]\nWantedBy=multi-user.target\n')
subprocess.run(['systemctl','start','siaga-arsip.service'],check=True)
def get(url):
    with urllib.request.urlopen('http://127.0.0.1:3000'+url,timeout=3) as r:return json.load(r)
for _ in range(60):
    try:
        if get('/api/public/stats')['total']==20:break
    except:time.sleep(.1)
else:raise RuntimeError('Legacy did not start')
source=pathlib.Path('/var/lib/siaga-arsip/data.json')
if case=='missing-file':
    data=json.loads(source.read_text());data['archives'][0].update(fileId='file_unknown_real',fileName='missing-real.pdf');source.write_text(json.dumps(data))
if case=='rollback':(root/'fail-final').touch()
before=hashlib.sha256(source.read_bytes()).hexdigest()
sha=subprocess.check_output(['git','-C','/fixture/current','rev-parse','HEAD'],text=True).strip()
result=subprocess.run(['bash','/fixture/current/scripts/vps-upgrade.sh',sha],capture_output=True,text=True,timeout=240)
(root/'result.log').write_text(result.stdout+'\n'+result.stderr)
print(result.stdout,flush=True)
if result.returncode not in ([0] if case=='success' else [1]):
    print(result.stderr)
    for log in pathlib.Path('/var/backups/siaga-arsip').glob('*/operations.log'):print(log.read_text()[-5000:])
    for log in root.glob('*.log'):print(log.name,log.read_text()[-3000:])
    raise RuntimeError('Unexpected exit code '+str(result.returncode))
assert before==hashlib.sha256(source.read_bytes()).hexdigest(),'Original JSON changed'
assert subprocess.check_output(['git','-C','/opt/siaga-arsip','rev-parse','HEAD'],text=True).strip()=='a12e25843d59787bfafeec36594d4dec47f3aece'
state=json.loads((root/'services.json').read_text())
configs=list(pathlib.Path('/etc/siaga-migrations').glob('*'))
for directory in configs:
    credentials=json.loads((directory/'admin-access.json').read_text());settings=json.loads((directory/'settings.json').read_text())
    dbpassword=settings['env']['DATABASE_URL'].split(':')[2].split('@')[0]
    for secret in [credentials['password'],dbpassword]:
        assert secret not in result.stdout+result.stderr,'Secret printed'
        for log in pathlib.Path('/var/backups/siaga-arsip').glob('*/operations.log'):assert secret not in log.read_text(),'Secret logged'
    for file in directory.iterdir():assert stat.S_IMODE(file.stat().st_mode)==0o600
if case=='success':
    assert get('/api/health')=={'ok':True};assert get('/api/config')=={'demoMode':False}
    assert state['siaga.service']['enabled'] and not state['siaga-arsip.service']['enabled']
    summary=json.loads(next(pathlib.Path('/var/backups/siaga-arsip').glob('*/migration-summary.json')).read_text())
    assert summary['archives']==20 and summary['users']==6 and summary['placeholderReferences']==20 and summary['files']==[]
    assert '127.0.0.1:3000' in subprocess.check_output(['ss','-ltn'],text=True)
    assert next(pathlib.Path('/var/backups/siaga-arsip').glob('*/postgres-before-cutover.sql')).stat().st_size>0
    assert next(pathlib.Path('/var/backups/siaga-arsip').glob('*/postgres-backups/*/manifest.json')).exists()
    dump=next(pathlib.Path('/var/backups/siaga-arsip').glob('*/postgres-before-cutover.sql'))
    subprocess.run(['runuser','-u','postgres','--','createdb','siaga_restore_test'],check=True,stdout=subprocess.DEVNULL)
    with open(dump,'rb') as input:
        subprocess.run(['runuser','-u','postgres','--','psql','-X','-q','-v','ON_ERROR_STOP=1','-d','siaga_restore_test'],stdin=input,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    restored=subprocess.check_output(['runuser','-u','postgres','--','psql','-X','-At','-d','siaga_restore_test','-c','SELECT count(*) FROM siaga_archives'],text=True).strip()
    assert restored=='20'
    print('PASS: production cutover, actual PostgreSQL 16 import, private credentials, loopback binding, backups, unchanged source.')
    print('PASS: pg_dump restores all 20 synthetic archive records to a fresh database.')
else:
    assert get('/api/public/stats')['total']==20
    assert state['siaga-arsip.service']['enabled']
    assert not pathlib.Path('/etc/systemd/system/siaga.service').exists()
    print('PASS: '+case+' abort restores old service and preserves original code/data.')
