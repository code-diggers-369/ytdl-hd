const fs = require("fs-extra");
const ytdl = require("ytdl-core");
const util = require("util");

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
    const audio = await audioDownload(url);

    await audio.on("finish", async () => {
      console.log("\n\naudio complte");
      // video download
      const video = await videoDownload(url);

      video.on("info", async (info) => {
        // fetching info
        var titleInfo = info.videoDetails.title
          ? info.videoDetails.title
          : info.title;

        const title = await titleEdit(titleInfo);

        // delete file if already exist
        if (fs.existsSync(`download/${title}`)) {
          // delete file if exist
          fs.unlink(`download/${title}`, (err) => {
            if (err) console.log(err);
          });
        }

        // merge files

        jointAudioVideo(video, title);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

// joint audio and video
const jointAudioVideo = (video, title) => {
  try {
    video
      .pipe(fs.createWriteStream("temp/video.mp4"))
      .on("finish", async () => {
        console.log("\n\nvideo complte");

        exec(
          `ffmpeg -i temp/video.mp4 -i temp/audio.mp3 -c copy -map 0:v:0 -map 1:a:0 download/${
            title ? title : "output.mp4"
          }`
        )
          .then(() => {
            fs.remove("temp");
          })
          .catch((err) => {
            console.log(err);
          });
      });
  } catch (err) {
    console.log(err);
  }
};

// edit title remove space and special characters
const titleEdit = (title) => {
  const replace = title.replace(/\||\?|\\|\/|\:|\*|"|\<|\>/g, "_");

  const finalTitle = replace.split(" ").join("_");

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

    return audio;
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
    }).on("progress", (_, totalByteReceived, totalByteFile) => {
      printProgress(
        `Video Download ${((totalByteReceived / totalByteFile) * 100).toFixed(
          2
        )} %`
      );
    });
    // .pipe(fs.createWriteStream("temp/video.mp4"));

    return video;
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
module.exports.ytdl_hd = ytdl_hd;
