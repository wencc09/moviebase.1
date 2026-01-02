
import React from 'react';

export const CONFIG = {
  GAS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbyuipb05zxPbPp7iAotqe_Oya4je2s-l3COcJ8kDO7e4VHjdLRuNwJhrymkPN02b9Sd/exec",
  GOOGLE_CLIENT_ID: "709445153038-vh9tvcrk5vtj0r3il5r81j9gl1k68l98.apps.googleusercontent.com",
};

export const GlobalStyles = () => (
  <style>{`
    :root {
      --bg0: #070a12;
      --bg1: #0e1425;
      --bg2: #1e2940;
      --accent: #84e3e8;
      --accent2: #e25f9e;
      --accent3: #f58e5f;
      --text: #eaf0ff;
      --muted: rgba(234,240,255,0.72);
      --stroke: rgba(255,255,255,0.14);
      --radius: 18px;
      --shadow: 0 18px 60px rgba(0,0,0,0.35);
    }

    [data-theme="light"] {
      --bg0: #fff3f8;
      --bg1: #fffdfb;
      --bg2: #ffe2ee;
      --accent: #ff6fa3;
      --accent2: #ff9fc0;
      --text: #0c1326;
      --muted: rgba(12,19,38,0.72);
      --stroke: rgba(255,120,160,0.18);
    }

    body {
      background: linear-gradient(135deg, var(--bg1), var(--bg0) 55%, var(--bg2)) fixed;
    }

    .bg-float::before, .bg-float::after {
      content: "";
      position: absolute; inset: -20%;
      background-image: 
        radial-gradient(circle at 10% 30%, rgba(255,255,255,.12) 0 2px, transparent 3px),
        radial-gradient(circle at 80% 40%, rgba(255,255,255,.10) 0 1.5px, transparent 3px),
        radial-gradient(circle at 40% 80%, rgba(255,255,255,.08) 0 1.2px, transparent 3px);
      background-size: 380px 380px;
      animation: drift 18s linear infinite;
    }
    @keyframes drift {
      0% { transform: translate3d(-2%, -2%, 0) rotate(0deg); }
      100% { transform: translate3d(2%, 2%, 0) rotate(6deg); }
    }

    .glass {
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
      backdrop-filter: blur(18px);
      border: 1px solid var(--stroke);
    }

    .cinema-screen {
      background: radial-gradient(1200px 520px at 20% 0%, rgba(255,255,255,.12), transparent 45%),
                  linear-gradient(135deg, rgba(0,0,0,.22), rgba(255,255,255,.06));
    }

    @keyframes mbSpin { to { transform: rotate(360deg); } }
    .animate-spin-custom { animation: mbSpin .9s linear infinite; }

    @keyframes mbWiggle {
      0%,100%{ transform: translate3d(0,0,0) rotate(0deg); }
      20%{ transform: translate3d(.7px,-.5px,0) rotate(-.18deg); }
      40%{ transform: translate3d(-.6px,.4px,0) rotate(.14deg); }
    }
    .wiggle { animation: mbWiggle 3s ease-in-out infinite; }
  `}</style>
);
