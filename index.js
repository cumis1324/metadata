const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const app = express();
const PORT = process.env.PORT || 5000;

// Function to download video to a temporary file
const downloadVideo = async (url, path) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  await pipeline(response.data, fs.createWriteStream(path));
};

app.get('/video-metadata', async (req, res) => {
  const movieUrl = req.query.url;

  if (!movieUrl) {
    return res.status(400).send('Missing video URL');
  }

  const tempVideoPath = './'; // Path to store the temporary video file

  try {
    // Download the video
    await downloadVideo(movieUrl, tempVideoPath);

    // Use ffmpeg to extract subtitle information
    ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
      if (err) {
        console.error("Error probing video:", err);
        return res.status(500).send('Error probing video');
      }

      const subtitles = metadata.streams
        .filter(stream => stream.codec_type === 'subtitle')
        .map(stream => ({
          label: stream.tags ? stream.tags.language : 'Unknown',
          language: stream.tags ? stream.tags.language : 'unknown',
          index: stream.index // Index of the subtitle stream
        }));

      // Clean up the temporary video file
      fs.unlinkSync(tempVideoPath);

      res.json({ subtitles });
    });
  } catch (error) {
    console.error("Failed to process video:", error);
    res.status(500).send('Failed to process video');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
