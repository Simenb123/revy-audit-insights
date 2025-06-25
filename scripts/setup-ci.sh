#!/bin/bash
# Simple setup script for CI environments
set -e

npm install --legacy-peer-deps
npm test
