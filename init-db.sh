#!/bin/bash
# Script to initialize database on Vercel
# Usage: ./init-db.sh

curl -X POST https://neetrino-calendar.vercel.app/api/admin/init-db \
  -H "Content-Type: application/json" \
  -v
