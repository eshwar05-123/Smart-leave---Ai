import { useRef, useState } from "react";

function getRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = "en-US";
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
}

export default function VoiceCapture({ onText }) {
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState("");
  const recRef = useRef(null);

  function toggle() {
    const Rec = getRecognition();
    if (!Rec) {
      setMsg("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }
    setMsg("");
    const rec = Rec;
    recRef.current = rec;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setMsg("Could not access microphone or recognition failed.");
    };
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript?.trim();
      if (text) onText(text);
    };
    rec.start();
  }

  return (
    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <button type="button" className="btn" onClick={toggle}>
        {listening ? "Stop dictation" : "Voice notes"}
      </button>
      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Speak briefly; text is appended to notes.</span>
      {msg && <span style={{ color: "var(--warning)", fontSize: "0.85rem" }}>{msg}</span>}
    </div>
  );
}
