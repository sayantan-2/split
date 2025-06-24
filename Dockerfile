# Use the official Bun image as a base
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy dependency management files
COPY bun.lock package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application source code
COPY . .

# Set NODE_ENV to production for the build
ENV NODE_ENV=production

# Build the application
RUN bun run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["bun", "run", "start"]
