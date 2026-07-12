import React, { useEffect, useState, useRef } from 'react';

const NameAnimationEnhanced = ({ name, onComplete }) => {
  const [phase, setPhase] = useState('intro');
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const canvasRef = useRef(null);

  // Particle system
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const numParticles = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      requestAnimationFrame(animateParticles);
    };

    animateParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Typing effect
  useEffect(() => {
    let index = 0;
    const typingSpeed = 80;

    const typeName = () => {
      if (index < name.length) {
        setDisplayText(name.substring(0, index + 1));
        index++;
        setTimeout(typeName, typingSpeed);
      } else {
        setPhase('typing');
        setTimeout(() => {
          setPhase('complete');
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 2000);
        }, 1500);
      }
    };

    const timer = setTimeout(typeName, 500);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, [name, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="name-animation-overlay">
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }} />
      
      <div className="name-animation-container" style={{ zIndex: 1 }}>
        <div className="name-background-glow"></div>
        
        <div className="name-display">
          <span className="name-text">
            {displayText}
            <span className={`cursor ${showCursor ? 'visible' : 'hidden'}`}>|</span>
          </span>
        </div>

        <div className={`name-subtitle ${phase === 'complete' ? 'visible' : ''}`}>
          ✨ Building something amazing ✨
        </div>

        <div className="name-decorations">
          <div className="deco-line deco-left"></div>
          <div className="deco-diamond">◆</div>
          <div className="deco-line deco-right"></div>
        </div>

        <div className="name-progress">
          <div 
            className="name-progress-bar"
            style={{
              width: phase === 'complete' ? '100%' : 
                     phase === 'typing' ? '70%' : 
                     `${(displayText.length / name.length) * 70}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default NameAnimationEnhanced;