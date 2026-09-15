'use client';

import { useState, useEffect, useRef } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Mic, Play, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { safeFetchJson } from '@/lib/api';

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillsParam = searchParams.get('skills');
  const initialSkills = skillsParam ? skillsParam.split(',') : [];

  const [role, setRole] = useState(initialSkills.length > 0 ? initialSkills.join(', ') + ' Engineer' : 'Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [mode, setMode] = useState('Live Coding');
  const [customSkills, setCustomSkills] = useState(initialSkills.join(', '));

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camStatus, setCamStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function setupDevices() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCamStatus('ok');
        setMicStatus('ok');
      } catch (err: any) {
        console.error('Media devices error:', err);
        setCamStatus('error');
        setMicStatus('error');
        setErrorMsg(err.message || 'Please allow camera and microphone permissions.');
      }
    }
    setupDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Intentionally leaving dependency array empty to run once

  const handleStart = async () => {
    setIsStarting(true);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const config = {
        language: 'English',
        mode: mode,
        companyStyle: 'Google-style',
        role: role,
        experienceLevel: experienceLevel,
        detectedSkills: customSkills.split(',').map(s => s.trim()).filter(Boolean),
      };

      const res = await safeFetchJson<{ interviewId?: string }>('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (res.ok && res.data?.interviewId) {
        router.push(`/interview/session?id=${res.data.interviewId}`);
      } else {
        setErrorMsg('Failed to create interview session.');
        setIsStarting(false);
      }
    } catch (e) {
      setErrorMsg('Error creating session.');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-white">Pre-flight Check</h1>
        <p className="text-slate-400 mt-2">Ensure your camera and microphone are working before entering the room.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col items-center">
          <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <Camera className="w-12 h-12 opacity-50 mb-2" />
              </div>
            )}
            {errorMsg && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 text-center text-rose-400 text-sm">
                <AlertTriangle className="w-5 h-5 mr-2" /> {errorMsg}
              </div>
            )}
          </div>

          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${camStatus === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-200">Camera</span>
              </div>
              {camStatus === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${micStatus === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-200">Microphone</span>
              </div>
              {micStatus === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Interview Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Role</label>
                <input 
                  type="text" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Experience</label>
                  <select 
                    value={experienceLevel} 
                    onChange={e => setExperienceLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead/Principal">Lead/Principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mode</label>
                  <select 
                    value={mode} 
                    onChange={e => setMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="Live Coding">Live Coding</option>
                    <option value="Conceptual / System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Key Skills (comma-separated)</label>
                <input 
                  type="text" 
                  value={customSkills} 
                  onChange={e => setCustomSkills(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  placeholder="e.g. React, Python, AWS..."
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleStart}
            disabled={camStatus !== 'ok' || micStatus !== 'ok' || isStarting}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all"
          >
            {isStarting ? (
              <span className="animate-pulse">Creating Session...</span>
            ) : (
              <>
                <Play className="w-5 h-5" /> Start Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>}>
      <SetupForm />
    </Suspense>
  );
}
