import { Config } from "@remotion/cli/config";

// Mascot SVGs are read live from the website's image folder (assets/img),
// so pose updates there show up here without copying.
Config.setPublicDir("../assets/img");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(20);
Config.setPixelFormat("yuv420p");
