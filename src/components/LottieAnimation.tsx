import Lottie from 'lottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieAnimationProps {
  /** Путь к JSON файлу (из public/) */
  jsonPath?: string;
  /** Путь к .lottie файлу (из public/) */
  lottiePath?: string;
  /** Данные анимации (если импортированы напрямую) */
  animationData?: unknown;
  /** Классы для контейнера */
  className?: string;
  /** Размеры */
  width?: number | string;
  height?: number | string;
  /** Настройки анимации */
  loop?: boolean;
  autoplay?: boolean;
  /** Скорость воспроизведения (1 = нормальная) */
  speed?: number;
}

export const LottieAnimation = ({
  jsonPath,
  lottiePath,
  animationData,
  className,
  width,
  height,
  loop = true,
  autoplay = true,
  speed = 1,
}: LottieAnimationProps) => {
  // Если указан .lottie файл (бинарный формат)
  if (lottiePath) {
    return (
      <div className={className} style={{ width, height }}>
        <DotLottieReact
          src={lottiePath}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
        />
      </div>
    );
  }

  // Если указан JSON путь или данные
  if (jsonPath || animationData) {
    return (
      <div className={className} style={{ width, height }}>
        <Lottie
          animationData={animationData}
          path={jsonPath}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
        />
      </div>
    );
  }

  return null;
};
