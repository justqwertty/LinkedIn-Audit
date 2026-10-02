import { useMemo } from 'react';

interface Props {
  score: number;
}

export default function ScoreGauge({ score }: Props) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const color = useMemo(() => {
    if (score >= 75) return { stroke: '#16a34a', bg: '#f0fdf4', text: '#16a34a' };
    if (score >= 50) return { stroke: '#ca8a04', bg: '#fefce8', text: '#ca8a04' };
    return { stroke: '#dc2626', bg: '#fef2f2', text: '#dc2626' };
  }, [score]);
  
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-100%" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color.stroke} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: color.text }}>{score}</span>
        <span className="text-sm text-gray-400">/100</span>
      </div>
    </div>
  );
}
