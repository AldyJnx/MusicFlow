import { catalogAudioFileFilter } from "./audio-file-filter";

describe("catalogAudioFileFilter", () => {
  function filter(originalname: string, mimetype: string) {
    const callback = jest.fn();
    catalogAudioFileFilter({}, { originalname, mimetype }, callback);
    return callback;
  }

  it.each([
    ["Juanes - Para llevar.wav", "audio/wav"],
    ["Juanes - Para llevar.FLAC", "audio/x-flac"],
  ])("accepts catalog master %s", (originalname, mimetype) => {
    expect(filter(originalname, mimetype)).toHaveBeenCalledWith(null, true);
  });

  it.each([
    ["Juanes - Para llevar.mp3", "audio/mpeg"],
    ["Juanes - Para llevar.wav", "audio/mpeg"],
    ["Juanes - Para llevar.flac", "application/octet-stream"],
  ])(
    "rejects non-lossless or mismatched catalog file %s",
    (originalname, mimetype) => {
      const callback = filter(originalname, mimetype);
      expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    },
  );
});
