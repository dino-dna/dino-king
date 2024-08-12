import { useEffect } from "react";

const useAudio = (url: string, isEnabled) => {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.play();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [url, isEnabled]);
};

export default useAudio;
