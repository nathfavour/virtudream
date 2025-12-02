import React, { useEffect, useRef } from 'react';
import { useGravity } from '../contexts/GravityContext';

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  bounceCount: number;
  isBursting: boolean;
  burstParticles?: { x: number, y: number, vx: number, vy: number, life: number }[];
}

const PhysicsBubbles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const frameRef = useRef<number>(0);
  const gravityRef = useGravity();

  // Spawn bubbles occasionally
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (document.hidden || bubblesRef.current.length > 15) return;
      
      const r = Math.random();
      const radius = 20 + Math.random() * 40;
      
      bubblesRef.current.push({
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: -radius * 2, // Start above screen
        vx: (Math.random() - 0.5) * 10,
        vy: 5 + Math.random() * 10,
        radius,
        color: `hsla(${Math.random() * 360}, 80%, 60%, 0.6)`,
        bounceCount: 0,
        isBursting: false
      });
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and Draw Bubbles
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];

        if (b.isBursting) {
          // Render Burst Particles
          if (b.burstParticles) {
            let alive = false;
            ctx.fillStyle = b.color;
            
            b.burstParticles.forEach(p => {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.5; // Gravity
              p.life -= 0.05;
              
              if (p.life > 0) {
                alive = true;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            });
            ctx.globalAlpha = 1;
            
            if (!alive) {
              bubblesRef.current.splice(i, 1);
            }
          }
          continue;
        }

        // Physics
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.5; // Gravity

        // GRAVITY WELL (PORTAL ATTRACTION)
        const portals = gravityRef.current.portals || [];
        if (portals.length > 0) {
           const nearest = portals[0];
           const cx = (nearest.x / 100) * width;
           const cy = (nearest.y / 100) * height;
           
           const dx = cx - b.x;
           const dy = cy - b.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist < 600) {
              const force = (600 - dist) * 0.003;
              b.vx += dx * force;
              b.vy += dy * force;
              
              // SUCKING EFFECT
              if (dist < 100) {
                 b.radius *= 0.9;
                 if (b.radius < 5) b.isBursting = true; 
              }
           }
        }

        // Floor Collision (Bounce)
        if (b.y + b.radius > height) {
          b.y = height - b.radius;
          b.vy *= -0.7; // Dampen bounce
          b.vx *= 0.9;  // Friction
          b.bounceCount++;
          
          // Sizzle effect on bounce (simple shake)
          b.x += (Math.random() - 0.5) * 5; 
        }

        // Wall Collision
        if (b.x - b.radius < 0 || b.x + b.radius > width) {
          b.vx *= -0.8;
          b.x = Math.max(b.radius, Math.min(width - b.radius, b.x));
        }

        // Burst Condition: Too many bounces or hitting corners aggressively
        if (b.bounceCount > 3 || (Math.abs(b.vx) > 10 && b.y > height - 50)) {
           b.isBursting = true;
           // Initialize particles
           b.burstParticles = [];
           for(let j=0; j<20; j++) {
             b.burstParticles.push({
               x: b.x, 
               y: b.y,
               vx: (Math.random() - 0.5) * 10,
               vy: (Math.random() - 0.5) * 10 - 5,
               life: 1.0
             });
           }
           continue;
        }

        // Draw Jelly Bubble
        ctx.save();
        ctx.translate(b.x, b.y);
        
        // Deformation based on velocity
        const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
        const angle = Math.atan2(b.vy, b.vx);
        const scaleX = 1 + Math.min(speed * 0.02, 0.3);
        const scaleY = 1 - Math.min(speed * 0.02, 0.3);
        
        ctx.rotate(angle);
        ctx.scale(scaleX, scaleY);
        
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        // Jelly Gradient
        const grad = ctx.createRadialGradient(-b.radius*0.3, -b.radius*0.3, b.radius*0.1, 0, 0, b.radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, b.color);
        ctx.fillStyle = grad;
        
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Click Handler
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      
      bubblesRef.current.forEach(b => {
         if (b.isBursting) return;
         
         const dx = mx - b.x;
         const dy = my - b.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         if (dist < b.radius + 20) { // Hit
            // Interaction logic
            b.bounceCount++; // Increment hit count
            
            // Impulse away from click
            const angle = Math.atan2(dy, dx);
            b.vx -= Math.cos(angle) * 15;
            b.vy -= Math.sin(angle) * 15;
            
            // Squish Effect
            // We can't easily animate squish state here without more props, 
            // but the velocity change will cause squish via the draw loop logic
            
            // Check for burst
            if (b.bounceCount > 4 || Math.random() > 0.8) {
               b.isBursting = true;
               b.burstParticles = [];
               for(let j=0; j<30; j++) {
                 b.burstParticles.push({
                   x: b.x, 
                   y: b.y,
                   vx: (Math.random() - 0.5) * 15,
                   vy: (Math.random() - 0.5) * 15,
                   life: 1.0 + Math.random() * 0.5
                 });
               }
            }
         }
      });
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-20 pointer-events-none" 
    />
  );
};

export default PhysicsBubbles;
