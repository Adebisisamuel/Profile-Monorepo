#!/bin/bash

# Script to export the Bedieningen Profiel database to a SQL file
# This script uses the environment variables from .env

echo "Exporting database to bedieningen_backup.sql..."

# Export the database
pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDATABASE > bedieningen_backup.sql

echo "Database exported to bedieningen_backup.sql"
echo "Use this file to import the data to your new database with:"
echo "psql -U your-new-db-user -h your-new-db-host -d your-new-db-name < bedieningen_backup.sql"