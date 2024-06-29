const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const cors = require('cors');

const execPromise = promisify(exec);

// Update ffmpegPath to point to the jellyfin-ffmpeg executable in the Docker container
const ffmpegPath = path.join(__dirname, 'ffmpeg/ffmpeg');

async function getVideoMetadata(videoUrl) {
  const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

  return new Promise((resolve, reject) => {
    const process = exec(`${ffmpegPath} -i pipe:0 -v quiet -print_format json -show_format -show_streams`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to process video: ${error.message}`);
        console.error(`FFmpeg stderr: ${stderr}`);
        return reject(new Error('Failed to process video'));
      }

      let metadata;
      try {
        metadata = JSON.parse(stdout);
      } catch (parseError) {
        console.error(`Failed to parse FFmpeg output: ${parseError.message}`);
        return reject(new Error('Failed to process video'));
      }

      const subtitles = (metadata.streams || []).filter(stream => stream.codec_type === 'subtitle');
      const formattedSubtitles = subtitles.map(subtitle => ({
        label: subtitle.tags ? subtitle.tags.language : 'Unknown',
        language: subtitle.tags ? subtitle.tags.language : 'unknown',
        src: videoUrl // Adjust this if subtitles are external
      }));

      resolve({ subtitles: formattedSubtitles });
    });

    process.stdin.write(Buffer.from(response.data));
    process.stdin.end();
  });
}

const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
});

module.exports = (req, res) => {
  console.log('Request received:', req.query);
  corsMiddleware(req, res, async () => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing video URL' });
    }

    try {
      const metadata = await getVideoMetadata(videoUrl);
      res.json(metadata);
    } catch (error) {
      console.error(`Error processing video metadata: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
};
