# =============================================================================
# Stage 1: Builder — Compile the Rust binary in a full Rust environment
# =============================================================================
FROM rust:slim-bookworm AS builder

# Build dependencies:
#   pkg-config      — lets cargo locate system libs
#   libssl-dev      — needed by ring (reqwest rustls-tls dependency)
#   libsqlite3-dev  — needed by sqlx sqlite feature
#   ca-certificates — TLS root certs
RUN apt-get update && apt-get install -y \
    pkg-config \
    build-essential \
    libssl-dev \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy dependency manifests first (cache layer: only re-downloads crates on Cargo.toml changes)
COPY Cargo.toml Cargo.lock ./

# Stub out both compilation units so cargo can pre-compile all external deps
RUN mkdir src \
    && echo 'fn main() {}' > src/main.rs \
    && echo '' > src/lib.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -f src/main.rs src/lib.rs

# Copy the real source and migrations, then build the final binary
COPY src ./src
COPY migrations ./migrations

# Touch source roots to ensure cargo re-links after the stub build
RUN touch src/main.rs src/lib.rs && cargo build --release

# =============================================================================
# Stage 2: Runtime — Minimal Debian image, no compiler, no build tools
# =============================================================================
FROM debian:bookworm-slim AS runtime

# Runtime dependencies:
#   libssl3       — runtime TLS (ring/rustls)
#   libsqlite3-0  — SQLite shared library
#   ca-certificates — TLS root certs for outbound HTTPS (Gemini API, Polygon RPC)
#   curl          — used by HEALTHCHECK
RUN apt-get update && apt-get install -y \
    libssl3 \
    libsqlite3-0 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root for security
RUN groupadd -r nutriid && useradd -r -g nutriid nutriid

WORKDIR /app

COPY --from=builder /usr/src/app/target/release/nutriid-backend /app/nutriid-backend
COPY --from=builder /usr/src/app/migrations /app/migrations

RUN chown -R nutriid:nutriid /app

USER nutriid

ENV PORT=3000
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

CMD ["/app/nutriid-backend"]
