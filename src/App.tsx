import { useState, useEffect } from "react";

interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  subject: string;
  tags: string[];
  notes: string;
  duration?: number;
}

export default function App() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");

  const subjects = ["Math", "Physics", "Chemistry", "Biology", "CS"];

  useEffect(() => {
    const stored = localStorage.getItem("sessions");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(
        parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        }))
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    let interval: any;
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        setCurrentSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            duration:
              Math.floor(
                (new Date().getTime() - prev.startTime.getTime()) / 1000
              ) || 0,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  const startSession = () => {
    if (!subject) return;

    const session: StudySession = {
      id: Date.now().toString(),
      startTime: new Date(),
      subject,
      tags: [],
      notes,
    };

    setCurrentSession(session);
    setIsTracking(true);
  };

  const stopSession = () => {
    if (!currentSession) return;

    const finished = {
      ...currentSession,
      endTime: new Date(),
      duration:
        Math.floor(
          (new Date().getTime() -
            currentSession.startTime.getTime()) /
            1000
        ) || 0,
    };

    setSessions((prev) => [...prev, finished]);
    setCurrentSession(null);
    setIsTracking(false);
  };

  const format = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📚 Study Tracker</h1>

      {!isTracking && (
        <>
          <div>
            <label>Subject:</label>
            <br />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Notes:</label>
            <br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={startSession}
            style={{ marginTop: 10 }}
          >
            ▶ Start
          </button>
        </>
      )}

      {isTracking && currentSession && (
        <div style={{ marginTop: 20 }}>
          <h2>⏱ {format(currentSession.duration || 0)}</h2>
          <p>Subject: {currentSession.subject}</p>

          <button onClick={stopSession}>
            ⏹ Stop
          </button>
        </div>
      )}

      <hr style={{ margin: "20px 0" }} />

      <h2>📜 History</h2>

      {sessions.length === 0 && <p>No sessions yet</p>}

      {sessions.map((s) => (
        <div key={s.id} style={{ marginBottom: 10 }}>
          <strong>{s.subject}</strong> —{" "}
          {format(s.duration || 0)}
          <br />
          <small>
            {s.startTime.toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
