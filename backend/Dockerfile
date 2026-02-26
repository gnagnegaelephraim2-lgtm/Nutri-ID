# =============================================================================
# Stage 1: Builder — Compile the Rust binary in a full Rust environment
# =============================================================================
FROM rust:1.76-slim-bookworm AS builder

# Install build dependencies for openssl and libpq (needed by sqlx + ethers)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy dependency manifests first (cache optimization: only rebuild on Cargo.toml changes)
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to compile deps first (dramatically speeds up rebuilds)
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -f src/main.rs

# Now copy the real source code and compile the production binary
COPY src ./src
COPY migrations ./migrations

# Force Cargo to recompile (touch the source to invalidate cache)
RUN touch src/main.rs && cargo build --release

# =============================================================================
# Stage 2: Runtime — Minimal Alpine image, no compiler, no build tools
# =============================================================================
FROM debian:bookworm-slim AS runtime

# Install only what's needed at runtime
RUN apt-get update && apt-get install -y \
    libssl3 \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security (never run as root in production)
RUN groupadd -r nutriid && useradd -r -g nutriid nutriid

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /usr/src/app/target/release/nutriid-backend /app/nutriid-backend

# Copy migrations if the app auto-runs them on startup
COPY --from=builder /usr/src/app/migrations /app/migrations

# Ensure the non-root user owns the working directory
RUN chown -R nutriid:nutriid /app

# Switch to the non-root user
USER nutriid

# Expose the Axum API port
EXPOSE 3000

# Health check for Docker orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the server
CMD ["/app/nutriid-backend"]
