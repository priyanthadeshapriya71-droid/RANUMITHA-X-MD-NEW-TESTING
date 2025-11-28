const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");

cmd({
  pattern: "tourl",
  alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
  react: '🖇',
  desc: "Convert media to Catbox URL (Max 200 MB)",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename
}, async (client, message, args, { reply }) => {
  try {
    // Get the media from reply
    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType) throw "Please reply to an image, video, or audio file";

    // Temp file path
    const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);

    // Stream media to temp file
    const mediaStream = await quotedMsg.download();
    const writeStream = fs.createWriteStream(tempFilePath);
    mediaStream.pipe(writeStream);
    await new Promise(res => writeStream.on('finish', res));

    // Check file size
    const stats = fs.statSync(tempFilePath);
    if (stats.size > 200 * 1024 * 1024) { // 200 MB
      fs.unlinkSync(tempFilePath);
      throw "File size exceeds 200 MB limit for Catbox";
    }

    // Determine file extension
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio')) extension = '.mp3';
    else extension = path.extname(tempFilePath);

    const fileName = `file${extension}`;

    // Prepare FormData for Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), fileName);
    form.append('reqtype', 'fileupload');

    // Upload to Catbox
    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    fs.unlinkSync(tempFilePath);

    if (!response.data) throw "Error uploading to Catbox";

    const mediaUrl = response.data;

    // Determine media type for message
    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = 'Image';
    else if (mimeType.includes('video')) mediaType = 'Video';
    else if (mimeType.includes('audio')) mediaType = 'Audio';

    // Send reply
    await reply(
      `*${mediaType} Uploaded Successfully*\n\n` +
      `*Size:* ${formatBytes(stats.size)}\n` +
      `*URL:* ${mediaUrl}\n\n` +
      `> © Powerd by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`
    );

  } catch (error) {
    console.error(error);
    await reply(`Error: ${error.message || error}`);
  }
});

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
