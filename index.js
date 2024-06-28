const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const execPromise = promisify(exec);
const path = require('path');

const ffmpegPath = path.join(__dirname, 'ffmpeg');

async function downloadFFmpeg() {
  if (!fs.existsSync(ffmpegPath)) {
    console.log('Downloading FFmpeg...');
    await execPromise('curl -L -o ffmpeg.zip https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz');
    await execPromise('tar -xf ffmpeg.zip --strip-components=1 -C api');
    console.log('FFmpeg downloaded and extracted');
  }
}

async function getVideoMetadata(videoUrl) {
  await downloadFFmpeg();

  const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

  return new Promise((resolve, reject) => {
    const process = exec(`${ffmpegPath}/ffmpeg -i pipe:0 -v quiet -print_format json -show_format -show_streams`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
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

module.exports = async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  try {
    const metadata = await getVideoMetadata(videoUrl);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
