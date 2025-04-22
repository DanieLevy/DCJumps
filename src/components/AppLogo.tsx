interface AppLogoProps {
  className?: string;
}

export default function AppLogo({ className = '' }: AppLogoProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-4xl font-bold text-indigo-600 mb-2 inline-block">
        <span className="text-indigo-700">DC</span>
        <span className="px-2 text-gray-700">·</span>
        <span className="text-indigo-500">JUMPS</span>
      </div>
      <div className="text-sm text-gray-500">Processor v2.1</div>
    </div>
  );
} 