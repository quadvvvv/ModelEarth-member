# Use the official Bun image
# See all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base

# Set the working directory
WORKDIR /usr/src/app

# Step 1: Install dependencies into a temporary directory to leverage caching
FROM base AS install
RUN mkdir -p /temp/dev
COPY backend/package.json backend/bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies only
RUN mkdir -p /temp/prod
COPY backend/package.json backend/bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Step 2: Copy node_modules and source files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY backend/src ./src
COPY backend/tests ./tests
# Copy any other necessary directories or files as needed

# [Optional] Test & build (adjust based on your setup)
ENV NODE_ENV=production
# Uncomment if you have tests or build steps:
# RUN bun test
# RUN bun run build

# Step 3: Copy production dependencies and source code into the final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY backend/src ./src
COPY backend/tests ./tests
# Copy any other necessary directories or files as needed

# Set Bun as the user to run the app
USER bun

# Expose the port your app will use
EXPOSE 8080/tcp

# Start the server
ENTRYPOINT [ "bun", "run", "src/index.js" ]
