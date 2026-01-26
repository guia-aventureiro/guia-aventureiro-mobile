#!/usr/bin/env bash

set -euo pipefail

echo "🔧 EAS Pre-Build Hook - Configurando Firebase..."

# Decodificar google-services.json do secret
if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "📱 Criando google-services.json para Android..."
  echo "$GOOGLE_SERVICES_JSON" | base64 --decode > google-services.json
  echo "✅ google-services.json criado com sucesso"
else
  echo "⚠️  GOOGLE_SERVICES_JSON secret não encontrado"
  exit 1
fi

# Decodificar GoogleService-Info.plist do secret
if [ -n "${GOOGLE_SERVICE_INFO_PLIST:-}" ]; then
  echo "🍎 Criando GoogleService-Info.plist para iOS..."
  echo "$GOOGLE_SERVICE_INFO_PLIST" | base64 --decode > GoogleService-Info.plist
  echo "✅ GoogleService-Info.plist criado com sucesso"
else
  echo "⚠️  GOOGLE_SERVICE_INFO_PLIST secret não encontrado"
fi

echo "✅ Hook concluído!"
