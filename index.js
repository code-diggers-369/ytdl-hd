const fs = require("fs-extra");
const ytdl = require("ytdl-core");
const util = require("util");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const exec = util.promisify(require("child_process").exec);

// display complte percentage
const printProgress = (message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
};

// main module
const ytdl_hd = async (url) => {
  try {
    // create folder
    await createFolders();

    // download files
    await downloadFiles(url);

    //
  } catch (err) {
    console.log(err);
  }
};

// download files
const downloadFiles = async (url) => {
  try {
    // audio download

    await audioDownload(url);

    // video download
    await videoDownload(url);

    // joint video and audio
    await jointAudioVideo(url);

    console.log("Done");
  } catch (err) {
    console.log(err);
  }
};

// joint audio and video
const jointAudioVideo = async (url) => {
  try {
    const title = await ytdl(url).on("info", async (info) => {
      var title = titleEdit(
        info.videoDetails.title ? info.videoDetails.title : info.title
      );

      // delete file if already exist
      if (fs.existsSync(`download/${title}`)) {
        // delete file if exist
        fs.unlink(`download/${title}`, (err) => {
          if (err) console.log(err);
        });
      }

      await exec(
        `ffmpeg -i temp/video.mp4 -i temp/audio.mp3 -c copy -map 0:v:0 -map 1:a:0 download/output.mp4`
      )
        .then(async () => {
          await fs.remove("temp");
          await fs.renameSync(`download/output.mp4`, `download/${title}`);
        })
        .catch((err) => {
          console.log(err);
        });
    });

    return new Promise((resolve, reject) => {
      title.on("end", resolve);

      title.on("error", reject);
    });
  } catch (err) {
    console.log(err);
  }
};

// // edit title remove space and special characters
const titleEdit = (title) => {
  const replace = title.replace(/\||\?|\\|\/|\:|\*|"|\<|\>/g, " ");

  const finalTitle = replace.split(" ").join(" ");

  return finalTitle + ".mp4";
};

// download audio listener
const audioDownload = async (url) => {
  try {
    const audio = await ytdl(url, {
      filter: "audioonly",
    })
      .on("progress", (_, totalByteReceived, totalByteFile) => {
        printProgress(
          `Audio Download ${((totalByteReceived / totalByteFile) * 100).toFixed(
            2
          )} %`
        );
      })
      .pipe(fs.createWriteStream("temp/audio.mp3"));

    return new Promise((resolve, reject) => {
      audio.on("finish", resolve);
      audio.on("error", reject);
    });
  } catch (err) {
    console.log(err);
  }
};

// download video listener
const videoDownload = async (url) => {
  try {
    var title = "output";
    const video = await ytdl(url, {
      filter: "videoonly",
      quality: "highestvideo",
    })
      .on("progress", (_, totalByteReceived, totalByteFile) => {
        printProgress(
          `Video Download ${((totalByteReceived / totalByteFile) * 100).toFixed(
            2
          )} %`
        );
      })
      .pipe(fs.createWriteStream("temp/video.mp4"));

    return new Promise((resolve, reject) => {
      video.on("finish", resolve);
      video.on("error", reject);
    });
  } catch (err) {
    console.log(err);
  }
};

// create folder
const createFolders = async () => {
  if (!fs.existsSync(`temp`))
    fs.mkdirSync(`temp`, (err) => {
      if (err) {
        console.error("Couldn't create folder download");
        return 0;
      }
      console.info("Successfully created folder download");
    });
  //
  if (!fs.existsSync(`download`))
    fs.mkdirSync(`download`, (err) => {
      if (err) {
        console.error("Couldn't create folder download");
        return 0;
      }
      console.info("Successfully created folder download");
    });

  return 1;
};

// export that module
module.exports = ytdl_hd;
