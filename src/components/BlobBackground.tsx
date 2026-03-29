export default function BlobBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />
      <div className="blob blob4" />
      <div className="blob blob5" />

      <style>{`
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          animation: blobFloat ease-in-out infinite;
        }

        .blob1 {
          width: 220px; height: 220px;
          background: rgba(124, 58, 237, 0.15);
          top: -60px; left: -60px;
          animation-duration: 14s;
        }
        .blob2 {
          width: 180px; height: 180px;
          background: rgba(245, 158, 11, 0.12);
          top: 35%; right: -40px;
          animation-duration: 18s;
          animation-delay: 3s;
        }
        .blob3 {
          width: 160px; height: 160px;
          background: rgba(167, 139, 250, 0.13);
          bottom: 10%; left: 20%;
          animation-duration: 22s;
          animation-delay: 6s;
        }
        .blob4 {
          width: 140px; height: 140px;
          background: rgba(245, 158, 11, 0.09);
          top: 20%; left: 50%;
          animation-duration: 16s;
          animation-delay: 9s;
        }
        .blob5 {
          width: 150px; height: 150px;
          background: rgba(124, 58, 237, 0.1);
          bottom: 25%; right: 15%;
          animation-duration: 20s;
          animation-delay: 4s;
        }

        :root.dark .blob1 { background: rgba(124, 58, 237, 0.22); }
        :root.dark .blob2 { background: rgba(245, 158, 11, 0.14); }
        :root.dark .blob3 { background: rgba(167, 139, 250, 0.18); }
        :root.dark .blob4 { background: rgba(245, 158, 11, 0.1); }
        :root.dark .blob5 { background: rgba(124, 58, 237, 0.16); }

        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -15px) scale(1.04); }
          50% { transform: translate(-15px, 20px) scale(0.96); }
          75% { transform: translate(15px, 12px) scale(1.02); }
        }
      `}</style>
    </div>
  )
}