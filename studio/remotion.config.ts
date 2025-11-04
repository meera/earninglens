import {Config} from '@remotion/cli/config';

// Studio port configuration
Config.setStudioPort(8082);

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');

// GPU acceleration (user has GPU machine)
Config.setChromiumOpenGlRenderer('angle');
Config.setChromiumHeadlessMode(true);

// Output settings
Config.setOutputLocation('out');

export default Config;
