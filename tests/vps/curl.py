#!/usr/bin/python3
# Test-only stand-in for the HTTPS edge. This is never shipped to the VPS.
import os,sys
args=[arg.replace('https://siaga-arsipbawasluacehtimur.web.id','http://127.0.0.1:3000') for arg in sys.argv[1:]]
os.execv('/usr/bin/curl',['/usr/bin/curl',*args])
