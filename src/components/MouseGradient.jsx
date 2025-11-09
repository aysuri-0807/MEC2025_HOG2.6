/**
 * Mouse-following gradient light effect component.
 * Creates a radial gradient that follows the mouse cursor when hovering over
 * the target element. Used for interactive visual effects on cards and boxes.
 * 
 * @author Ammaar Shareef
 */
import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const MouseGradient = ({ targetRef, enabled = true }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (!enabled || !targetRef?.current) return;

    const handleMouseMove = (e) => {
      const rect = targetRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    const element = targetRef.current;
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, targetRef]);

  if (!enabled || !isHovering) return null;

  return (
    <Box
      ref={gradientRef}
      sx={{
        position: 'absolute',
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 68, 68, 0.15) 0%, rgba(255, 68, 68, 0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        transition: 'opacity 0.3s ease',
        zIndex: 1,
      }}
    />
  );
};

export default MouseGradient;

