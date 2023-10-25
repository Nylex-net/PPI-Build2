import hashlib
import os
import base64

# Generate a random code verifier (usually 43-128 characters in length)
code_verifier = base64.urlsafe_b64encode(os.urandom(32)).rstrip(b'=').decode('utf-8')

# Calculate the code challenge by taking the SHA-256 hash of the code verifier
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode('utf-8')).digest()
).rstrip(b'=').decode('utf-8')

print("Code Verifier:", code_verifier)
print("Code Challenge:", code_challenge)