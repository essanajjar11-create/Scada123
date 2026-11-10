import base64, sys
with open(sys.argv[1], 'ab') as f:
    f.write(base64.b64decode(sys.argv[2].encode('ascii')))
