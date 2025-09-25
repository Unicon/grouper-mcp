#!/bin/bash
set -e

CERT_DIR="certs"

echo "🔐 Generating self-signed certificates for HTTPS..."

# Create certs directory if it doesn't exist
mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/key.pem 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/key.pem -out $CERT_DIR/csr.pem -subj "/C=US/ST=Local/L=Local/O=Grouper MCP/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/csr.pem -signkey $CERT_DIR/key.pem -out $CERT_DIR/cert.pem \
  -extensions v3_req -extfile <(echo "
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
")

# Clean up CSR
rm $CERT_DIR/csr.pem

# Set appropriate permissions
chmod 600 $CERT_DIR/key.pem
chmod 644 $CERT_DIR/cert.pem

echo "✅ Certificates generated successfully!"
echo "📁 Certificate: $CERT_DIR/cert.pem"
echo "🔑 Private key: $CERT_DIR/key.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   Your browser will show a security warning - this is expected."