const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors());


app.get('/video-metadata', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  try {
    console.log(`Fetching video metadata for URL: ${videoUrl}`);
    const videoStream = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream'
    });

    ffmpeg.ffprobe(videoStream.data, (err, metadata) => {
      if (err) {
        console.error(`Failed to process video: ${err.message}`);
        return res.status(500).json({ error: 'Failed to process video' });
      }

      const subtitles = (metadata.streams || []).filter(stream => stream.codec_type === 'subtitle');
      const formattedSubtitles = subtitles.map(subtitle => ({
        label: subtitle.tags ? subtitle.tags.language : 'Unknown',
        language: subtitle.tags ? subtitle.tags.language : 'unknown',
        src: videoUrl // You might need to adjust this if subtitles are external
      }));

      res.json({ subtitles: formattedSubtitles });
    });
  } catch (error) {
    console.error(`Error fetching video metadata: ${error.message}`);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
