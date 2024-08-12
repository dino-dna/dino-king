import useAudio from "./useAudio";

const useLobbyChiptune = (isEnabled: boolean) => {
  useAudio("/public/tracks/erik_skiff_chibi_ninja.mp3", isEnabled); // Replace with the actual URL of your chiptune
};

export default useLobbyChiptune;
