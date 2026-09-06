# Python Interop Profile v0.2

This is an independent Python implementation. It uses pinned `rfc8785` for JCS bytes and `cryptography` for Ed25519; it does not consume JavaScript-produced canonical bytes.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r examples/python-interop-v0.2/requirements.txt
.venv/bin/python examples/python-interop-v0.2/verify_vectors.py
```

The input domain is RFC 8785's I-JSON domain. The package rejects values outside its supported IEEE-754/JCS domain, including non-finite numbers, integers that cannot be represented interoperably, and malformed Unicode.
