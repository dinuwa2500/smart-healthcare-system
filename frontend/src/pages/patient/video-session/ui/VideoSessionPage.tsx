'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionApi } from '@/src/entities/session/api';
import type { VideoSession } from '@/src/entities/session/model';
import { Spinner } from '@/src/shared/ui/Spinner';

type AgoraClient   = import('agora-rtc-sdk-ng').IAgoraRTCClient;
type LocalAudio    = import('agora-rtc-sdk-ng').IMicrophoneAudioTrack;
type LocalVideo    = import('agora-rtc-sdk-ng').ICameraVideoTrack;

export function VideoSessionPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') ?? '';

  const [session,   setSession]   = useState<VideoSession | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [joined,    setJoined]    = useState(false);
  const [micOn,     setMicOn]     = useState(true);
  const [camOn,     setCamOn]     = useState(true);
  const [leaving,   setLeaving]   = useState(false);

  const clientRef    = useRef<AgoraClient | null>(null);
  const audioRef     = useRef<LocalAudio | null>(null);
  const videoRef     = useRef<LocalVideo | null>(null);

  // Fetch session data
  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }
    sessionApi.getByAppointment(appointmentId)
      .then((r) => setSession(r.data.data))
      .catch(() => toast.error('Session not found'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  // Join Agora channel once session is loaded
  const joinChannel = useCallback(async () => {
    if (!session || joined) return;

    // Dynamic import – agora-rtc-sdk-ng is browser-only
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Subscribe to remote users
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        user.videoTrack?.play('remote-video');
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    try {
      await client.join(
        session.agoraAppId,
        session.channelName,
        session.patientRtcToken,
        session.patientUid
      );

      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);

      audioRef.current = audioTrack;
      videoRef.current = videoTrack;

      // Play local preview
      videoTrack.play('local-video');

      await client.publish([audioTrack, videoTrack]);
      setJoined(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join session';
      toast.error(msg);
    }
  }, [session, joined]);

  useEffect(() => {
    if (session && !joined) joinChannel();
  }, [session, joined, joinChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.close();
      videoRef.current?.close();
      clientRef.current?.leave().catch(() => null);
    };
  }, []);

  const toggleMic = async () => {
    if (!audioRef.current) return;
    await audioRef.current.setEnabled(!micOn);
    setMicOn((v) => !v);
  };

  const toggleCam = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setEnabled(!camOn);
    setCamOn((v) => !v);
  };

  const endCall = async () => {
    setLeaving(true);
    try {
      audioRef.current?.close();
      videoRef.current?.close();
      await clientRef.current?.leave();
      router.push('/patient/my-appointments');
    } catch {
      router.push('/patient/my-appointments');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-500">
        <p>{appointmentId ? 'No session found for this appointment.' : 'Missing appointment information for this video session.'}</p>
        <button onClick={() => router.back()} className="text-teal-600 underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Remote video – full screen */}
      <div id="remote-video" className="h-full w-full bg-gray-800">
        {!joined && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <Spinner size="lg" />
              <p className="mt-3 text-sm">Connecting to session…</p>
            </div>
          </div>
        )}
      </div>

      {/* Local video – picture-in-picture */}
      <div
        id="local-video"
        className="absolute bottom-24 right-4 h-36 w-24 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gray-700 sm:h-44 sm:w-32"
      />

      {/* Session info banner */}
      <div className="absolute top-4 left-4 rounded-lg bg-black/50 px-3 py-2 text-white text-xs">
        <p className="font-medium">Channel: {session.channelName}</p>
        <p className="text-gray-300">Appointment: {appointmentId.slice(-8)}</p>
      </div>

      {/* Call controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={toggleMic}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors shadow-lg
            ${micOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>

        <button
          onClick={toggleCam}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors shadow-lg
            ${camOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>

        <button
          onClick={endCall}
          disabled={leaving}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg disabled:opacity-60"
          title="End call"
        >
          {leaving ? <Spinner size="sm" /> : <PhoneOff className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
