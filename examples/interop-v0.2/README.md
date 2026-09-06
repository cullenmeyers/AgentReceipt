# BoundaryAttest Interop Profile v0.2 examples

Build and run the JavaScript vectors:

```sh
npm run build
npm run example:interop-v0.2
```

Create a temporary Python environment and independently run the same vectors:

```sh
python3 -m venv /tmp/boundaryattest-v02-venv
/tmp/boundaryattest-v02-venv/bin/python -m pip install -r examples/python-interop-v0.2/requirements.txt
/tmp/boundaryattest-v02-venv/bin/python examples/python-interop-v0.2/verify_vectors.py
```

For cross-signature verification, use `sign-file.js` with Python `verify_receipt.py`, then Python `sign_receipt.py` with `verify-file.js`. Both implementations parse and canonicalize `sample-claim.json` independently; they do not exchange precomputed canonical bytes.
