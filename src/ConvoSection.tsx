import { useEffect, useRef, useState } from 'react';
// import {
//   IconPlayerPlayFilled,
//   IconPlayerSkipForwardFilled,
//   IconPlayerStopFilled,
//   IconVolume,
// } from '@tabler/icons-react';
import hark from 'hark';
import SiriWave from 'siriwave';
import { View, Text, Button } from 'react-native';

export default function ConvoSection() {
  const [count, setCount] = useState(0);
  const forceUpdate = () => setCount((c) => c + 1);

  const recorder = useRef<MediaRecorder>();
  const audioChunks = useRef<Blob[]>([]);
  const [loading, setLoading] = useState(false);

  const player = useRef<HTMLAudioElement>();
  const audiowave = useRef<SiriWave>();

  // iOS doesn't allow audio to play without user interaction
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  useEffect(() => {
    if (!audioBlob) return;
    const playButton = document.getElementById('ios-play-audio');
    playButton?.addEventListener('click', () => {
      playAudio(audioBlob);
      setAudioBlob(null);
    });
  }, [audioBlob]);
  //

  const isPlaying = () => {
    return player.current && player.current.duration > 0 && !player.current.paused;
  };
  const isRecording = () => {
    return recorder.current?.state === 'recording';
  };

  const startAudioWave = () => {
    if (audiowave.current) {
      audiowave.current.start();
      forceUpdate();
    }
  };
  const stopAudioWave = () => {
    if (audiowave.current) {
      audiowave.current.stop();
      forceUpdate();
    }
  };
  useEffect(() => {
    // Create SiriWave if it doesn't exist
    setTimeout(() => {
      if (audiowave.current) return;
      audiowave.current = new SiriWave({
        container: document.getElementById('audiowave')!,
        width: Math.min(window.innerWidth * 0.6, 500) - 50,
        height: 300,
        style: 'ios9',
        ratio: 2,
        speed: 0.1,
        amplitude: 1.1,
      });
      stopAudioWave();
    }, 100);
  }, []);

  const handleAudioInput = async (audio: Blob) => {
    const formData = new FormData();
    formData.append('file', audio, 'audio.wav');
    const res = await fetch(`https://jeff-ai.onrender.com/convo?to_id=${1}&from_id=${-1}`, {
      // http://localhost:3000/
      // https://jeff-ai.onrender.com/
      method: 'POST',
      body: formData,
    });
    const response = await res.blob();

    if (isIOS()) {
      setAudioBlob(response);
    } else {
      playAudio(response);
    }
  };

  const startRecording = () => {
    recorder.current?.stop();
    recorder.current = undefined;
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
        },
      })
      .then(function (stream) {
        // Create a MediaRecorder instance to record audio
        const mediaRecorder = new MediaRecorder(stream);

        // Event handler when data is available (audio chunk is recorded)
        mediaRecorder.ondataavailable = function (event) {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.start();

        mediaRecorder.onstop = function () {
          finishRecording(new Blob(audioChunks.current, { type: 'audio/wav' }));
          audioChunks.current = [];
        };
        recorder.current = mediaRecorder;

        // Detect speaking events
        const speechEvents = hark(stream, { interval: 100 });
        speechEvents.on('speaking', function () {
          console.log('Started Speaking >');
          audioChunks.current = [];
          stopAudio();
        });
        speechEvents.on('stopped_speaking', function () {
          console.log('< Stopped Speaking');
          recorder.current?.stop();
        });

        forceUpdate();
      });
  };
  const finishRecording = async (audioBlob: Blob) => {
    setLoading(true);

    // Release the microphone
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = undefined;
    audioChunks.current = [];
    forceUpdate();

    try {
      await handleAudioInput(audioBlob);
    } catch (error) {
      /**/
    }
    setLoading(false);
  };

  function playAudio(audioBlob: Blob) {
    stopAudio();
    try {
      const audioUrl = URL.createObjectURL(audioBlob);

      player.current = new Audio(audioUrl);
      player.current
        .play()
        .then(() => {
          console.log('Audio started');

          startRecording();

          startAudioWave();
          forceUpdate();
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
          startRecording();
        });

      // Release memory after playback
      player.current.addEventListener('ended', () => {
        console.log('Audio stopped');

        stopAudio();
        URL.revokeObjectURL(audioUrl);
        forceUpdate();
      });
    } catch (error) {
      console.error('Error fetching and playing audio:', error);
      startRecording();
    }
  }

  function stopAudio() {
    player.current?.pause();
    stopAudioWave();
  }

  return (
    <View>
      <Text>{count}</Text>

      <View style={{ position: 'relative' }}>
        {true && (
          <View
            id='audiowave'
            style={{
              position: 'absolute',
              top: '75%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: isPlaying() ? undefined : 'none',
            }}
          ></View>
        )}
      </View>

      <View>
        <View>
          <View>
            <Button
              onPress={async () => {
                if (isPlaying()) {
                  stopAudio();
                  startRecording();
                } else if (isRecording()) {
                  recorder.current?.stop();
                } else {
                  startRecording();
                }
              }}
              title={isPlaying() ? 'Interrupt' : isRecording() ? 'Stop Talking' : 'Start Talking'}
            />

            {/* {audioBlob && isIOS() && (
              <Button
                id='ios-play-audio'
                size='sm'
                variant='outline'
                rightSection={<IconVolume size='1.0rem' />}
              >
                Play
              </Button>
            )} */}
          </View>
        </View>
      </View>
    </View>
  );
}
