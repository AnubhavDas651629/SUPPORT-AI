#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Configuration (These would normally be loaded from an .env file or GitHub Secrets)
DB_USER="postgres"
DB_NAME="postgres"
S3_BUCKET="s3://your-company-backups/support-ai"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
FILENAME="backup_${DATE}.sql.gz"
BACKUP_DIR="/tmp/backups"

echo "============================================="
echo " Starting Automated Database Backup..."
echo "============================================="

# 1. Create a temporary directory to store the backup
mkdir -p ${BACKUP_DIR}
cd ${BACKUP_DIR}

# 2. Dump the database and compress it instantly using gzip
# (We use docker exec because postgres is running inside a container)
echo "📦 Dumping and compressing database: ${DB_NAME}..."
docker exec -t support-ai-postgres-1 pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${FILENAME}

echo "✅ Backup successfully created: ${BACKUP_DIR}/${FILENAME}"

# 3. Upload to AWS S3 (Assuming AWS CLI is configured on the machine)
echo "☁️  Uploading to AWS S3 bucket: ${S3_BUCKET}..."
# aws s3 cp ${FILENAME} ${S3_BUCKET}/${FILENAME}

# 4. Clean up the local file so we don't run out of disk space!
echo "🧹 Cleaning up local files..."
rm ${FILENAME}

echo "🎉 Backup Process Complete!"
echo "============================================="
