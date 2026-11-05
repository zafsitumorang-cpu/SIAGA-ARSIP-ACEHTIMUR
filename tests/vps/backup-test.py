import subprocess,pathlib,json,os,tempfile,shutil
# Entire test runs in an isolated Docker container; these stand-ins never reach VPS.
subprocess.run(['python3','/fixture/run-test.py','success'],check=True,stdout=subprocess.DEVNULL)
p=pathlib.Path('/usr/local/bin/systemctl');s=p.read_text()
s=s.replace("if name and not name.endswith('.service'):name+='.service'", "if name and not name.endswith(('.service','.timer')):name+='.service'")
s=s.replace("def start(name):\n", "def start(name):\n    if name.endswith('.timer'):\n        state.setdefault(name,{'pid':0})['active']=True;save();return\n")
s=s.replace("cwd=fields['WorkingDirectory'];cmd=shlex.split(fields['ExecStart'])", "cwd=fields['WorkingDirectory'];cmd=shlex.split(fields['ExecStart'])")
s=s.replace("user=pwd.getpwnam(fields['User']);uid=user.pw_uid;gid=user.pw_gid", """user=pwd.getpwnam(fields['User']);uid=user.pw_uid;gid=user.pw_gid
        if fields.get('Type')=='oneshot':
            if (root/'fail-backup').exists():raise RuntimeError('Injected backup failure')
            subprocess.run(cmd,cwd=cwd,env=env,check=True,stdout=subprocess.DEVNULL)
            return""")
s=s.replace("active=name in ['caddy.service','postgresql.service'] or alive", "active=state.get(name,{}).get('active',False) or name in ['caddy.service','postgresql.service'] or alive")
s=s.replace("elif command=='show':print(state.get(name,{}).get('pid',0))", """elif command=='show':
    prop=sys.argv[sys.argv.index('-p')+1]
    if prop=='MainPID':print(state.get(name,{}).get('pid',0))
    else:
        unit=pathlib.Path('/etc/systemd/system/'+name).read_text();fields=dict(line.split('=',1) for line in unit.splitlines() if '=' in line)
        if prop=='WorkingDirectory':print(fields['WorkingDirectory'])
        elif prop=='EnvironmentFiles':print(fields['EnvironmentFile']+' (ignore_errors=no)')
        else:raise ValueError(prop)""")
s=s.replace("elif command=='daemon-reload':", "elif command=='list-timers':print('NEXT: daily 02:00 Asia/Jakarta; fixture timer active')\nelif command=='daemon-reload':")
s=s.replace("pathlib.Path('/etc/systemd/system/siaga.service').read_text()","pathlib.Path('/etc/systemd/system/'+name).read_text()")
p.write_text(s)
script='/fixture/install-backup-timer.sh';root=pathlib.Path('/fixture-state')
state=json.loads((root/'services.json').read_text());pid=state['siaga.service']['pid']
unit=pathlib.Path('/etc/systemd/system/siaga.service').read_text();fields=dict(line.split('=',1) for line in unit.splitlines() if '=' in line)
backup_dir=pathlib.Path(json.loads((pathlib.Path(fields['EnvironmentFile']).parent/'settings.json').read_text())['env']['BACKUP_DIR'])
before=len(list(backup_dir.glob('*/manifest.json')))
(root/'fail-backup').touch()
r=subprocess.run(['bash',script],capture_output=True,text=True)
assert r.returncode!=0,(r.stdout,r.stderr); assert '[1/2]' in r.stdout,(r.stdout,r.stderr)
assert not pathlib.Path('/etc/systemd/system/siaga-backup.service').exists()
assert json.loads((root/'services.json').read_text())['siaga.service']['pid']==pid
(root/'fail-backup').unlink()
print('PASS: failed initial backup removes new units and leaves application running.')
r=subprocess.run(['bash',script],capture_output=True,text=True)
assert r.returncode==0,(r.stdout,r.stderr)
state=json.loads((root/'services.json').read_text());assert state['siaga.service']['pid']==pid
assert state['siaga-backup.timer']['enabled'] and state['siaga-backup.timer']['active']
assert len(list(backup_dir.glob('*/manifest.json')))>before
service='/etc/systemd/system/siaga-backup.service';timer='/etc/systemd/system/siaga-backup.timer'
subprocess.run(['/usr/bin/systemd-analyze','verify',service,timer],check=True)
subprocess.run(['/usr/bin/systemd-analyze','calendar','*-*-* 02:00:00 Asia/Jakarta'],check=True,stdout=subprocess.DEVNULL)
for file in pathlib.Path('/etc/siaga-migrations').glob('*/admin-access.json'):
    assert json.loads(file.read_text())['password'] not in r.stdout+r.stderr
print('PASS: actual PostgreSQL backup and manifest, validated units, Jakarta schedule, timer enabled, unchanged application PID, no credential printed.')
r=subprocess.run(['bash',script],capture_output=True,text=True);assert r.returncode!=0
assert json.loads((root/'services.json').read_text())['siaga-backup.timer']['enabled']
print('PASS: reinstall refuses to overwrite existing backup units.')
