#!/bin/bash
set -e

echo "========================================"
echo "Generating SSL Certificates"
echo "========================================"

mkdir -p certs

# Create OpenSSL configuration file with proper extensions
cat > certs/openssl-san.cnf << 'EOF'
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C = US
ST = Local
L = Local
O = Grouper MCP
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate certificate with proper extensions for browser compatibility
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -config certs/openssl-san.cnf \
  -extensions v3_req

# Clean up config file
rm certs/openssl-san.cnf

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Location:"
echo "   Certificate: certs/cert.pem"
echo "   Private Key: certs/key.pem"
echo ""
echo "⏰ Valid for: 365 days"
echo ""
echo "🔒 Certificate includes:"
echo "   - Digital Signature + Key Encipherment (browser compatible)"
echo "   - TLS Web Server Authentication"
echo "   - Subject Alternative Names (localhost, 127.0.0.1)"
echo ""
