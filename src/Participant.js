import React, { useState, useEffect, useRef } from "react";

const Participant = ({ participant, onShare,autio_unmute_mute, video_unmute_mute }) => {
  const [videoTracks, setVideoTracks] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [audioMute, setAudioMute] = useState(false);
  const [videoMute, setVideoMute] = useState(false);
  const [isScreenSharingSupported, setIsScreenSharingSupported] = useState(true);
  const [isScreenSharingEnabled, setIsScreenSharingEnabled] = useState(false);

  const videoRef = useRef();
  const audioRef = useRef();

  const trackpubsToTracks = (trackMap) =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

  useEffect(() => {
    setVideoTracks(trackpubsToTracks(participant.videoTracks));
    setAudioTracks(trackpubsToTracks(participant.audioTracks));

    const trackSubscribed = (track) => {
      if (track.kind === "video") {
        setVideoTracks((videoTracks) => [...videoTracks, track]);
      } else if (track.kind === "audio") {
        setAudioTracks((audioTracks) => [...audioTracks, track]);
      }
    };

    const trackUnsubscribed = (track) => {
      if (track.kind === "video") {
        setVideoTracks((videoTracks) => videoTracks.filter((v) => v !== track));
      } else if (track.kind === "audio") {
        setAudioTracks((audioTracks) => audioTracks.filter((a) => a !== track));
      }
    };

    participant.on("trackSubscribed", trackSubscribed);
    participant.on("trackUnsubscribed", trackUnsubscribed);

    return () => {
      setVideoTracks([]);
      setAudioTracks([]);
      participant.removeAllListeners();
    };
  }, [participant]);

  useEffect(() => {
    const videoTrack = videoTracks[0];
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTracks]);

  useEffect(() => {
    const audioTrack = audioTracks[0];
    if (audioTrack) {
      audioTrack.attach(audioRef.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [audioTracks]);

  const onVideoButton = () => {
    setVideoMute(!videoMute)
    video_unmute_mute();
  }

  const onAudioButton = () => {
    setAudioMute(!audioMute)
    autio_unmute_mute();
  }



  return (
    <div className="participant">
      <h3>{participant.identity}</h3>
      <video ref={videoRef} autoPlay={true} muted={videoMute}  controls/>
      <audio ref={audioRef} autoPlay={true} muted={audioMute} controls>
      </audio>

      <div>
        <button type="button"
          onClick={onShare}
          disabled={!isScreenSharingSupported}
          >{isScreenSharingEnabled ? "Stop sharing" : "Start sharing"}
        </button>
         <button type="button" onClick={() => onVideoButton()}>{videoMute ? "mute": "unmmute"}</button>
        <button type="button" onClick={() => onAudioButton()}>{audioMute ? "mute": "unmute"}</button>
      </div>
      
    </div>
  );
};

export default Participant;
