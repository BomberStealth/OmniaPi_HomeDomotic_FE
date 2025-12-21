// ============================================
// SKELETON LOADER COMPONENT
// ============================================

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = ''
}: SkeletonProps) => {
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:1000px_100%]';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl h-32'
  };

  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '100%';
  const heightStyle = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle || (variant === 'circular' ? widthStyle : undefined)
      }}
    />
  );
};

// ============================================
// SKELETON CARD COMPONENT
// ============================================

export const SkeletonCard = () => {
  return (
    <div className="glass-solid rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={80} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height={36} />
        <Skeleton variant="rectangular" height={36} />
      </div>
    </div>
  );
};

// ============================================
// SKELETON LIST COMPONENT
// ============================================

export const SkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      ))}
    </div>
  );
};
