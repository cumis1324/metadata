# Use an official Node.js runtime as a parent image
FROM node:22

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy the application source code
COPY . .

# Install app dependencies
RUN npm install

# Expose the port on which the app will run
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
