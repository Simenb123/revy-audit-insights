#!/bin/bash
# Simple setup script for CI environments
set -e

npm install --legacy-peer-deps

# Install Deno for running edge function tests
curl -fsSL https://deno.land/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

npm test

# Run Deno tests for Supabase edge functions
deno test supabase/functions
