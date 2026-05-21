#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install whitenoise gunicorn dj-database-url psycopg2-binary
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate