import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showText = true,
}) => {
  const sizeMap = {
    sm: { icon: 32, width: 86 },
    md: { icon: 40, width: 108 },
    lg: { icon: 52, width: 140 },
    xl: { icon: 80, width: 220 },
  };

  const { icon, width } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center overflow-hidden flex-shrink-0"
        style={{ width: showText ? width : icon, height: icon }}
      >
        <img
          src="/capitalnest.png"
          alt="CapitalNest Nepal"
          className="max-w-none h-full object-contain object-left"
          style={{ width }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};
