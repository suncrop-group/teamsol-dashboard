import React, { useState, useEffect } from 'react';

interface MaintenanceScreenProps {
  message?: string;
  until?: string | null;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  until,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!until) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(until).getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [until]);

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 text-center">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500 bg-card/50 backdrop-blur-md border border-border/50 p-8 rounded-3xl shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="relative p-4 bg-primary/10 rounded-full ring-1 ring-primary/20">
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 opacity-75 duration-1000" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary relative z-10"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
          Under Maintenance
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          {message ||
            "We're currently making improvements to serve you better. We'll be back shortly!"}
        </p>

        {timeLeft && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-background/50 backdrop-blur shadow-inner">
            <div className="bg-primary/5 px-4 py-2 border-b border-border/50">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">
                System Restoration In
              </p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-border/50 p-4">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center p-2"
                >
                  <span className="text-2xl font-bold text-foreground font-mono tabular-nums">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 items-center text-sm text-muted-foreground">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span>Working on updates...</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
