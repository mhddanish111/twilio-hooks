import React, { useState, useEffect } from 'react';
import Video from 'twilio-video';
import Participant from './Participant';
import { isEmpty, first } from "lodash";

const Room = ({ roomName, token, handleLogout }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState([]);
  const [localAudioTrack, setLocalAudioTrack] = useState([]);
  const [screenTrack, setScreenTrack] = useState(null);

  useEffect(async() => {
    const participantConnected = async participant => {
      await setParticipants(prevParticipants => [...prevParticipants, participant]);
    };

    const participantDisconnected = async participant => {
     await setParticipants(prevParticipants =>
        prevParticipants.filter(p => p !== participant)
      );
    };

    const localVideoTrack = await Video.createLocalVideoTrack();
    setLocalVideoTrack(localVideoTrack);

    const localAudioTrack = await Video.createLocalAudioTrack();
    setLocalAudioTrack(localAudioTrack);

    Video.connect(token, {
      name: roomName,
      audio:true,
      isRecording: true,
      tracks: [localVideoTrack, localAudioTrack],
      insights: false
    }).then(room => {
      setRoom(room);
      room.on('participantConnected', participantConnected);
      room.on('participantDisconnected', participantDisconnected);
      room.participants.forEach(participantConnected);
    });

    return () => {
      setRoom(currentRoom => {
        console.log("currentRoom", currentRoom);
        if (currentRoom && currentRoom.localParticipant.state === 'connected') {
          currentRoom.localParticipant.tracks.forEach(function(trackPublication) {
            trackPublication.track.stop();
          });
          currentRoom.disconnect();
          return null;
        } else {
          return currentRoom;
        }
      });
    };
  }, [roomName, token]);

  const stopScreenTrack = () => {
    if (screenTrack) {
      screenTrack.stop();
      setScreenTrack(null);
    }
  }


  const onShare = async () => {
    try {

      if (!screenTrack) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        const newScreenTrack = first(stream.getVideoTracks());

        setScreenTrack(new Video.LocalVideoTrack(newScreenTrack))

        room.localParticipant.publishTrack(newScreenTrack);
        room.localParticipant.unpublishTrack(localVideoTrack);
      } else {
        room.localParticipant.unpublishTrack(screenTrack);
        room.localParticipant.publishTrack(localVideoTrack);
        stopScreenTrack();
      }
    } catch (error) {
      stopScreenTrack();

      // this.setState({
      //   errorMessage: error.message
      // });
    }
  }

  const autio_unmute_mute = () => {
    var localParticipant = room.localParticipant;
    localParticipant.audioTracks.forEach(function (audioTrack) {
    if ( audioTrack.track.isEnabled == true ) {
            audioTrack.track.disable();
    } else {
        audioTrack.track.enable();
    }
    });
  }

  const video_unmute_mute = () => {
    var localParticipant = room.localParticipant;
    localParticipant.videoTracks.forEach(function (videoTrack) {
    if ( videoTrack.track.isEnabled == true ) {
      videoTrack.track.disable();
    } else {
      videoTrack.track.enable();
    }
    });
  }


  const remoteParticipants = participants.map(participant => (
    <Participant key={participant.sid} participant={participant} onShare={onShare} autio_unmute_mute={autio_unmute_mute}
    video_unmute_mute={video_unmute_mute} />
  ));

  return (
    <div className="room">
      <h2>Room: {roomName}</h2>
      <button onClick={handleLogout}>Log out</button>
      <div className="local-participant">
        {room ? (
          <Participant
            key={room.localParticipant.sid}
            participant={room.localParticipant}
            onShare={onShare}
            autio_unmute_mute={autio_unmute_mute}
            video_unmute_mute={video_unmute_mute}
          />
        ) : (
          ''
        )}
      </div>
      <h3>Remote Participants</h3>
      <div className="remote-participants">{remoteParticipants}</div>
    </div>
  );
};

export default Room;
