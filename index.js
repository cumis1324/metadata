const cors = require('cors');
const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/video-metadata', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  try {
    console.log(`Fetching video metadata for URL: ${videoUrl}`);
    const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

    // Use FFmpeg to probe the video metadata
    exec(`ffmpeg -i pipe:0 -v quiet -print_format json -show_format -show_streams`, {
        input: response.data,
        maxBuffer: 10 * 1024 * 1024 // Increase max buffer size if necessary
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`FFmpeg error: ${error.message}`);
          console.error(`FFmpeg stderr: ${stderr}`);
          return res.status(500).json({ error: 'Failed to process video' });
        }

      // Parse FFmpeg JSON output
      let metadata;
      try {
        metadata = JSON.parse(stdout);
      } catch (parseError) {
        console.error(`Failed to parse FFmpeg output: ${parseError.message}`);
        return res.status(500).json({ error: 'Failed to process video' });
      }

      // Extract subtitles information
      const subtitles = (metadata.streams || []).filter(stream => stream.codec_type === 'subtitle');
      const formattedSubtitles = subtitles.map(subtitle => ({
        label: subtitle.tags ? subtitle.tags.language : 'Unknown',
        language: subtitle.tags ? subtitle.tags.language : 'unknown',
        src: videoUrl // Adjust this if subtitles are external
      }));

      res.json({ subtitles: formattedSubtitles });
    });
  } catch (error) {
    console.log(`FFmpeg command: ffmpeg -i pipe:0 -v quiet -print_format json -show_format -show_streams`);
    console.error(`Error fetching video metadata: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch video metadata' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
