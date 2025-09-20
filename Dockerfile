FROM python:3.11-slim
WORKDIR /app
COPY . /app
WORKDIR /app/backend
RUN python -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install -r requirements.txt
ENV PATH="/opt/venv/bin:${PATH}"
ENV FLASK_ENV=production
EXPOSE 8000
CMD ["gunicorn","-b","0.0.0.0:8000","app:app","--chdir","/app/backend","--workers","2"]
