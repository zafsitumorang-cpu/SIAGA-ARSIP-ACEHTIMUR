#!/usr/bin/python3
# Test service manager: real processes, pg_ctlcluster, and systemd unit validation.
import os,sys,json,pathlib,subprocess,signal,time,pwd,shlex
root=pathlib.Path('/fixture-state');root.mkdir(exist_ok=True)
state_file=root/'services.json'
state=json.loads(state_file.read_text()) if state_file.exists() else {'siaga-arsip.service':{'enabled':True,'pid':0}}
args=[a for a in sys.argv[1:] if a not in ['--quiet','--now']]
command=args[0];name=next((a for a in args[1:] if not a.startswith('-') and a not in ['MainPID','--value']),None)
if name and not name.endswith('.service'):name+='.service'
def save():state_file.write_text(json.dumps(state))
def alive(pid):
    try:return pathlib.Path(f'/proc/{pid}/stat').read_text().split(') ',1)[1][0]!='Z'
    except:return False
def stop(name):
    data=state.setdefault(name,{'enabled':False,'pid':0});pid=data.get('pid',0)
    if alive(pid):
        os.kill(pid,signal.SIGTERM)
        for _ in range(120):
            if not alive(pid):break
            time.sleep(.05)
        if alive(pid):raise RuntimeError('Fixture child did not stop')
    data['pid']=0;save()
def start(name):
    if name=='postgresql.service':
        if subprocess.run(['/usr/bin/pg_ctlcluster','16','main','status'],stdout=subprocess.DEVNULL).returncode:
            subprocess.run(['/usr/bin/pg_ctlcluster','--skip-systemctl-redirect','16','main','start'],check=True)
        return
    data=state.setdefault(name,{'enabled':False,'pid':0})
    if alive(data.get('pid',0)):return
    env=os.environ.copy();uid=0;gid=0
    if name=='siaga-arsip.service':
        cwd='/opt/siaga-arsip';cmd=['/usr/local/bin/node','app.mjs'];env.update(DATA_DIR='/var/lib/siaga-arsip',PORT='3000')
        for key in ['DATABASE_URL','NODE_ENV','DEMO_MODE','APP_ORIGIN']:env.pop(key,None)
    else:
        unit=pathlib.Path('/etc/systemd/system/siaga.service').read_text();fields={}
        for line in unit.splitlines():
            if '=' in line:
                key,value=line.split('=',1);fields[key]=value
        cwd=fields['WorkingDirectory'];cmd=shlex.split(fields['ExecStart'])
        for line in pathlib.Path(fields['EnvironmentFile']).read_text().splitlines():
            if '=' in line:
                key,value=line.split('=',1);env[key]=value
        user=pwd.getpwnam(fields['User']);uid=user.pw_uid;gid=user.pw_gid
        if (root/'fail-final').exists() and env['PORT']=='3000':raise RuntimeError('Injected final start failure')
        if alive(state.get('siaga-arsip.service',{}).get('pid',0)):raise RuntimeError('New service started before old service stopped')
    output=open(root/(name+'.log'),'ab')
    def demote():
        if uid:os.setgroups([]);os.setgid(gid);os.setuid(uid)
    proc=subprocess.Popen(cmd,cwd=cwd,env=env,stdout=output,stderr=output,start_new_session=True,preexec_fn=demote)
    data['pid']=proc.pid;save();time.sleep(.2)
    if proc.poll() is not None:raise RuntimeError('Fixture process startup failed')
if command=='is-active':
    active=name in ['caddy.service','postgresql.service'] or alive(state.get(name,{}).get('pid',0))
    if '--quiet' not in sys.argv:print('active' if active else 'inactive')
    sys.exit(0 if active else 3)
elif command=='is-enabled':
    enabled=state.get(name,{}).get('enabled',False);print('enabled' if enabled else 'disabled');sys.exit(0 if enabled else 1)
elif command=='show':print(state.get(name,{}).get('pid',0))
elif command=='cat':
    p=pathlib.Path('/etc/systemd/system')/name
    if not p.exists():sys.exit(1)
    print(p.read_text())
elif command in ['start','stop']:
    try:(start if command=='start' else stop)(name)
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
elif command in ['enable','disable']:
    state.setdefault(name,{'pid':0})['enabled']=command=='enable';save()
    if '--now' in sys.argv and command=='enable':start(name)
elif command=='daemon-reload':
    unit=pathlib.Path('/etc/systemd/system/siaga.service')
    if unit.exists():subprocess.run(['/usr/bin/systemd-analyze','verify',str(unit)],check=True)
else:print('Unsupported fixture command:',sys.argv,file=sys.stderr);sys.exit(1)
