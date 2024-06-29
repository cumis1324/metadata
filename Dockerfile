# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Download and install jellyfin-ffmpeg
RUN mkdir -p /usr/src/app/ffmpeg && \
    curl -L -o /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz https://repo.jellyfin.org/releases/ffmpeg/jellyfin-ffmpeg-release-4.4.1-1-linux-amd64.tar.xz && \
    tar -xf /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz -C /usr/src/app/ffmpeg --strip-components=1 && \
    rm /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV production

# Command to run the app
CMD [ "node", "server.js" ]
