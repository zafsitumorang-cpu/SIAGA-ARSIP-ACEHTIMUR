import subprocess,pathlib,json,os,sys,urllib.request,hashlib
# Isolated test only. Prior fixture uses real PostgreSQL and modeled systemd/HTTPS.
subprocess.run(['python3','/fixture/current/tests/vps/backup-test.py'],check=True,stdout=subprocess.DEVNULL)
root=pathlib.Path('/fixture-state');manager=pathlib.Path('/usr/local/bin/systemctl');s=manager.read_text()
s=s.replace("cwd=fields['WorkingDirectory'];cmd=shlex.split(fields['ExecStart'])", "cwd=fields.get('WorkingDirectory','/');cmd=shlex.split(fields['ExecStart'])")
s=s.replace("for line in pathlib.Path(fields['EnvironmentFile']).read_text().splitlines():", "for line in (pathlib.Path(fields['EnvironmentFile']).read_text().splitlines() if fields.get('EnvironmentFile') else []):")
s=s.replace("if (root/'fail-final').exists() and env['PORT']=='3000':", "if (root/'fail-final').exists() and env.get('PORT')=='3000' and '/auto-' in cwd:")
s=s.replace("def save():state_file.write_text(json.dumps(state))", """def save():state_file.write_text(json.dumps(state))
def fields_for(name):
    fields={}
    paths=[pathlib.Path('/etc/systemd/system')/name]+sorted((pathlib.Path('/etc/systemd/system')/(name+'.d')).glob('*.conf'))
    for file in paths:
        for line in file.read_text().splitlines():
            if '=' in line:
                key,value=line.split('=',1);fields[key]=value
    return fields""")
s=s.replace("cwd=fields.get('WorkingDirectory','/');cmd=shlex.split(fields['ExecStart'])", "fields=fields_for(name);cwd=fields.get('WorkingDirectory','/');cmd=shlex.split(fields['ExecStart'])")
s=s.replace("unit=pathlib.Path('/etc/systemd/system/'+name).read_text();fields=dict(line.split('=',1) for line in unit.splitlines() if '=' in line)", "fields=fields_for(name)")
s=s.replace("elif command in ['start','stop']:", "elif command=='restart':\n    stop(name);start(name)\nelif command in ['start','stop']:")
manager.write_text(s)
# Serve public API/immutable raw files locally; no external routes or SSH.
pathlib.Path('/usr/local/bin/curl').write_text('''#!/usr/bin/python3
import os,sys,json,subprocess,pathlib
args=sys.argv[1:];url=next((a for a in args if a.startswith('https:')),None)
if url and ('api.github.com/' in url or 'raw.githubusercontent.com/' in url):
    if 'api.github.com/' in url:
        sha=subprocess.check_output(['git','--git-dir=/fixture/remote.git','rev-parse','refs/heads/main'],text=True).strip()
        value=pathlib.Path('/fixture-state/ci-status').read_text().strip()
        data=json.dumps({'workflow_runs':[{'path':'.github/workflows/checks.yml','name':'Application checks','head_sha':sha,'event':'push','head_branch':'main','head_repository':{'full_name':'wrong/repo' if value=='wrong-repo' else 'zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR'},'status':'completed','conclusion':'success' if value=='wrong-repo' else value}]}).encode()
    else:data=pathlib.Path('/fixture/current/scripts/auto-deploy.sh').read_bytes()
    if '-o' in args:pathlib.Path(args[args.index('-o')+1]).write_bytes(data)
    else:sys.stdout.buffer.write(data)
    sys.exit(0)
args=[a.replace('https://siaga-arsipbawasluacehtimur.web.id','http://127.0.0.1:3000') for a in args]
os.execv('/usr/bin/curl',['/usr/bin/curl',*args])
''')
pathlib.Path('/usr/local/bin/curl').chmod(0o755)
base=subprocess.check_output(['git','-C','/fixture/current','rev-parse','HEAD'],text=True).strip()
subprocess.run(['git','-C','/fixture/current','checkout','-b','auto-target'],check=True,stdout=subprocess.DEVNULL)
pathlib.Path('/fixture/current/public/auto-test.txt').write_text('new runtime asset')
subprocess.run(['git','-C','/fixture/current','add','public/auto-test.txt'],check=True)
subprocess.run(['git','-C','/fixture/current','-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-m','test target'],check=True,stdout=subprocess.DEVNULL)
good=subprocess.check_output(['git','-C','/fixture/current','rev-parse','HEAD'],text=True).strip()
subprocess.run(['git','-C','/fixture/current','push','/fixture/remote.git','HEAD:refs/heads/main'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(root/'ci-status').write_text('failure')
state=lambda:json.loads((root/'services.json').read_text())
initial_pid=state()['siaga.service']['pid']
r=subprocess.run(['bash','/fixture/current/scripts/install-auto-deploy.sh',base],capture_output=True,text=True)
assert r.returncode==0,(r.stdout,r.stderr)
assert state()['siaga-auto-deploy.timer']['enabled'] and state()['siaga-auto-deploy.timer']['active']
assert state()['siaga.service']['pid']==initial_pid
print('PASS: enrollment installs validated timer; failed CI cannot deploy.')
subprocess.run(['cp','-a','/root/.npm','/var/lib/siaga-auto-deploy/npm-cache'],check=True)
(root/'ci-status').write_text('wrong-repo')
r=subprocess.run(['bash','/usr/local/sbin/siaga-auto-deploy'],capture_output=True,text=True);assert r.returncode==0
assert state()['siaga.service']['pid']==initial_pid
print('PASS: foreign-repository CI cannot authorize deployment.')
(root/'ci-status').write_text('success')
# Temporary incompatible SQL target: must fail before touching the app.
with open('/fixture/current/db/schema.sql','a') as file:file.write('\n-- incompatible schema fixture\n')
subprocess.run(['git','-C','/fixture/current','add','db/schema.sql'],check=True)
subprocess.run(['git','-C','/fixture/current','-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-m','schema fixture'],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['git','-C','/fixture/current','push','/fixture/remote.git','HEAD:refs/heads/main'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
r=subprocess.run(['bash','/usr/local/sbin/siaga-auto-deploy'],capture_output=True,text=True);assert r.returncode!=0
assert 'Schema berubah' in r.stdout,(r.stdout,r.stderr)
assert state()['siaga.service']['pid']==initial_pid
print('PASS: schema changes require planned migration; current app remains running.')
subprocess.run(['git','--git-dir=/fixture/remote.git','update-ref','refs/heads/main',good],check=True)
(root/'fail-final').touch()
r=subprocess.run(['bash','/usr/local/sbin/siaga-auto-deploy'],capture_output=True,text=True)
assert r.returncode!=0,(r.stdout,r.stderr)

if 'Kode layanan sebelumnya sehat kembali' not in r.stdout:
    for file in pathlib.Path('/var/backups/siaga-deploy').glob('*/operations.log'):print(file.read_text()[-4000:])
assert 'Kode layanan sebelumnya sehat kembali' in r.stdout,(r.stdout,r.stderr)
assert not pathlib.Path('/etc/systemd/system/siaga.service.d/50-auto-deploy.conf').exists()
print('PASS: failed cutover restores old service and verifies health without DB rewind.')
(root/'fail-final').unlink()
r=subprocess.run(['bash','/usr/local/sbin/siaga-auto-deploy'],capture_output=True,text=True)
if r.returncode:
    print(r.stdout,r.stderr)
    for file in pathlib.Path('/var/backups/siaga-deploy').glob('*/operations.log'):print(file.read_text()[-5000:])
assert r.returncode==0
assert '[5/5]' in r.stdout
assert not pathlib.Path('/etc/systemd/system/siaga-candidate.service').exists()
assert pathlib.Path('/etc/systemd/system/siaga-backup.service.d/50-auto-deploy.conf').exists()
with urllib.request.urlopen('http://127.0.0.1:3000/assets/auto-test.txt') as response:assert response.read()==b'new runtime asset'
with urllib.request.urlopen('http://127.0.0.1:3000/api/config') as response:assert json.load(response)=={'demoMode':False}
for file in pathlib.Path('/etc/siaga-migrations').glob('*/admin-access.json'):assert json.loads(file.read_text())['password'] not in r.stdout+r.stderr
print('PASS: approved code deployed, public/local health checked, backup release updated, candidate removed, credentials withheld.')
pid=state()['siaga.service']['pid'];r=subprocess.run(['bash','/usr/local/sbin/siaga-auto-deploy'],capture_output=True,text=True)
assert r.returncode==0 and state()['siaga.service']['pid']==pid
subprocess.run(['systemctl','start','siaga-backup.service'],check=True)
print('PASS: unchanged commit is a no-op; scheduled backup still works after update.')
