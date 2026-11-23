FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt ./
RUN pip install --no-cache-dir --only-binary :all: \
    pip==25.0.1 \
    setuptools==79.0.1 \
    wheel==0.46.3 \
    jaraco.context==6.1.0
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --require-hashes --only-binary :all: -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "wsgi:application"]
