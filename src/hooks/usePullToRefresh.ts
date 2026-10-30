/**
 * @file usePullToRefresh.ts
 * @description Hook customizado para detectar o gesto de "Puxar para Atualizar" (Pull-To-Refresh) em dispositivos móveis.
 * Implementa física de resistência elástica (spring damping), detecção do topo de rolagem (scrollTop === 0)
 * e resposta tátil via haptic feedback (vibração nativa) quando o limite é atingido.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  /** Callback assíncrono executado para recarregar os dados do Firestore */
  onRefresh: () => Promise<void>;
  /** Distância mínima em pixels para ativar a atualização (padrão: 65px) */
  threshold?: number;
  /** Distância máxima de puxão permitida (padrão: 110px) */
  maxPull?: number;
  /** Habilita vibração tátil ao ultrapassar o limite (padrão: true) */
  vibrate?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 65,
  maxPull = 110,
  vibrate = true,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number>(0);
  const thresholdReachedRef = useRef<boolean>(false);

  // Manipulador de início do toque
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || isRefreshing) return;

    // Só inicia se a rolagem estiver exatamente no topo
    if (el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
      thresholdReachedRef.current = false;
    }
  }, [isRefreshing]);

  // Manipulador de movimento do toque
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || !isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Apenas se estiver puxando para baixo no topo
    if (diff > 0 && el.scrollTop <= 0) {
      // Aplica resistência física progressiva (fator 0.45)
      const calculatedPull = Math.min(maxPull, diff * 0.45);
      setPullDistance(calculatedPull);

      // Feedback tátil ao atingir o limite
      if (calculatedPull >= threshold && !thresholdReachedRef.current) {
        thresholdReachedRef.current = true;
        if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(25);
          } catch {
            // Ignora se não houver permissão de vibração
          }
        }
      } else if (calculatedPull < threshold) {
        thresholdReachedRef.current = false;
      }

      // Impede a rolagem padrão da página durante o puxão
      if (e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, maxPull, threshold, vibrate]);

  // Manipulador de término do toque
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Mantém o indicador visível durante o recarregamento

      try {
        await onRefresh();
      } catch (err) {
        console.warn('Aviso durante a atualização dos dados:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  // Registra os ouvintes de eventos de toque no container ref com suporte a cancelamento
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isThresholdReached = pullDistance >= threshold;

  return {
    containerRef,
    pullDistance,
    isPulling,
    isRefreshing,
    isThresholdReached,
  };
}
