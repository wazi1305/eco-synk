from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.x509 import (
    CertificateBuilder, Name, NameAttribute,
    SubjectAlternativeName, DNSName, IPAddress
)
from cryptography.x509.oid import NameOID
from datetime import datetime, timedelta
from pathlib import Path
import ipaddress

# Generate private key
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# Save private key
Path('key.pem').write_bytes(
    key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
)

# Create certificate
subject = issuer = Name([
    NameAttribute(NameOID.COMMON_NAME, '192.168.125.40')
])

cert = (
    CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(1000)
    .not_valid_before(datetime.utcnow())
    .not_valid_after(datetime.utcnow() + timedelta(days=365))
    .add_extension(
        SubjectAlternativeName([
            DNSName('localhost'),
            IPAddress(ipaddress.IPv4Address('192.168.125.40'))
        ]),
        critical=False
    )
    .sign(key, hashes.SHA256())
)

# Save certificate
Path('cert.pem').write_bytes(cert.public_bytes(serialization.Encoding.PEM))

print('✅ Self-signed certificate created: cert.pem + key.pem')
