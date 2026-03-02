import React, { useEffect, useState } from "react";

interface Props {
    show: boolean;
}

const StethoscopeLoader: React.FC<Props> = ({ show }) => {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 800);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-[9999] transition-all duration-700 ease-in-out ${show ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* High-End Dark Medical Glass Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />

            {/* Custom Keyframes for 60fps Animation */}
            <style>{`
        @keyframes medical-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes chest-piece-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; filter: blur(20px); transform: scale(1); }
          50% { opacity: 0.6; filter: blur(40px); transform: scale(1.3); }
        }
      `}</style>

            {/* Content Container */}
            <div className="relative flex flex-col items-center">

                {/* Soft Outer Glow Aura */}
                <div
                    className="absolute w-40 h-40 bg-blue-500/30 rounded-full"
                    style={{ animation: 'glow-pulse 4s ease-in-out infinite' }}
                />

                {/* Realistic Metallic Stethoscope */}
                <div
                    className="relative w-40 h-40 md:w-48 md:h-48"
                    style={{ animation: 'medical-float 6s ease-in-out infinite' }}
                >
                    <svg
                        viewBox="0 0 120 120"
                        className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            {/* Metallic Gradient for depth */}
                            <linearGradient id="metal-plating" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="40%" stopColor="#94a3b8" />
                                <stop offset="60%" stopColor="#475569" />
                                <stop offset="100%" stopColor="#1e293b" />
                            </linearGradient>

                            {/* Medical Blue Tubing Gradient */}
                            <linearGradient id="tube-style" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>

                        {/* Headset Arc (Chromed Metal) */}
                        <path
                            d="M35 30 C 35 15, 85 15, 85 30 M35 30 L 38 50 C 38 65, 82 65, 82 50 L 85 30"
                            stroke="url(#metal-plating)"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            className="opacity-90"
                        />

                        {/* Soft Ear Tips */}
                        <circle cx="35" cy="30" r="3" fill="#1e293b" />
                        <circle cx="85" cy="30" r="3" fill="#1e293b" />

                        {/* Main Medical Tubing */}
                        <path
                            d="M60 62 V 85"
                            stroke="url(#tube-style)"
                            strokeWidth="5.5"
                            strokeLinecap="round"
                        />

                        {/* Rotating Chest Piece (Apple-style polish) */}
                        <g style={{ animation: 'chest-piece-spin 12s linear infinite', transformOrigin: '60px 98px' }}>
                            {/* Outer Metallic Ring */}
                            <circle
                                cx="60"
                                cy="98"
                                r="14"
                                stroke="url(#metal-plating)"
                                strokeWidth="3.5"
                                fill="rgba(15, 23, 42, 0.9)"
                            />
                            {/* Inner Diaphragm */}
                            <circle
                                cx="60"
                                cy="98"
                                r="9"
                                fill="rgba(59, 130, 246, 0.15)"
                                stroke="#60a5fa"
                                strokeWidth="0.5"
                                className="animate-pulse"
                            />
                            {/* Center Reflection */}
                            <path
                                d="M57 98 H 63 M 60 95 V 101"
                                stroke="#94a3b8"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                opacity="0.6"
                            />
                        </g>
                    </svg>
                </div>

                {/* Premium Text Styling */}
                <div className="mt-6 flex flex-col items-center gap-3">
                    <span
                        className="text-white text-[11px] md:text-xs font-light tracking-[0.3em] uppercase opacity-80 animate-pulse"
                    >
                        Connecting to Trusted Clinics
                    </span>

                    {/* Subtle Progress Bar */}
                    <div className="w-24 h-[1px] bg-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500 w-1/2 animate-[shimmer_2s_infinite]"
                            style={{
                                animation: 'shimmer 1.5s ease-in-out infinite',
                                background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)'
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
};

export default StethoscopeLoader;