#!/bin/bash

# Script to import a database backup to the Bedieningen Profiel database
# This script uses the environment variables from .env

if [ -z "$1" ]; then
  echo "Usage: ./import-database.sh <backup-file.sql>"
  exit 1
fi

echo "Importing database from $1..."

# Import the database
psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDATABASE < $1

echo "Database imported successfully"