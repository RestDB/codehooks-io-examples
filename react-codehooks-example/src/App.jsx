import { useEffect, useRef, useState } from 'react';

// Served from the same origin in production, so the API path is relative.
// For `npm run dev`, point VITE_API_URL at your deployed backend URL.
const API = import.meta.env.VITE_API_URL ?? '';
const ROTATE_MS = 3600;

// Roll a number up from 0 to `target` once, respecting reduced-motion.
function useCountUp(target, active) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    if (!active || target == null) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const duration = 1100;
    const startedAt = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, active]);

  return value;
}

export default function App() {
  const [hello, setHello] = useState(null); // { message, visitors }
  const [messages, setMessages] = useState([]);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | connected | error

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${API}/api/hello`).then((r) => r.json()),
      fetch(`${API}/api/messages`).then((r) => r.json()),
    ])
      .then(([helloData, messageList]) => {
        if (!alive) return;
        setHello(helloData);
        setMessages(Array.isArray(messageList) ? messageList : []);
        setStatus('connected');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [messages]);

  const visitors = useCountUp(hello?.visitors, status === 'connected');

  const statusText = {
    loading: 'connecting to your backend',
    connected: 'live from your codehooks backend',
    error: 'backend unreachable — run coho deploy',
  }[status];

  return (
    <div className="stage">
      <div className="glow" aria-hidden="true" />
      <div className="grid" aria-hidden="true" />

      <main className="panel">
        <p className="status">
          <span className={`dot dot--${status}`} aria-hidden="true" />
          {statusText}
        </p>

        <h1 className="hello">{hello?.message ?? 'Hello World!'}</h1>

        <div className="rotator">
          <p className="message" key={idx}>
            {messages[idx] ?? 'Reading messages from the database…'}
          </p>
          <p className="caption">
            seeded once, inside <code>app.init()</code>
          </p>
        </div>

        <div className="counter">
          <span className="counter__value">{visitors.toLocaleString()}</span>
          <span className="counter__label">
            visitors so far, counted in the key-value store
          </span>
        </div>
      </main>

      <footer className="foot">
        <span>React frontend + Codehooks backend</span>
        <span className="foot__sep" aria-hidden="true" />
        <span>one file, one deploy</span>
      </footer>
    </div>
  );
}
