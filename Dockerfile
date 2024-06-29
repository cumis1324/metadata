# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY . .

# Install dependencies
RUN npm install

# Download and install jellyfin-ffmpeg
RUN mkdir -p /usr/src/app/ffmpeg && \
    curl -L -o /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz https://repo.jellyfin.org/files/ffmpeg/linux/latest-6.x/amd64/jellyfin-ffmpeg_6.0.1-7_portable_linux64-gpl.tar.xz && \
    tar -xf /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz -C /usr/src/app/ffmpeg --strip-components=1 && \
    rm /usr/src/app/ffmpeg/jellyfin-ffmpeg.tar.xz

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "node", "index.js" ]
