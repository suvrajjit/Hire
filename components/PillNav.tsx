/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#fff',
  pillColor = '#060010',
  hoveredPillTextColor = '#060010',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const logoImgRef = useRef<HTMLImageElement>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        
        // Use a diameter large enough to cover the pill even diagonally
        const D = Math.sqrt(w * w + h * h) * 1.5;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.top = '50%';
        circle.style.left = '50%';
        circle.style.bottom = 'auto'; // Reset bottom

        // Initial state: centered, scaled down
        gsap.set(circle, {
          xPercent: -50,
          yPercent: -50,
          scale: 0,
          transformOrigin: '50% 50%'
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        // Animation: Scale up to fill
        tl.to(circle, { scale: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: h + 20, opacity: 0 }); // Start slightly lower
          tl.to(white, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    // ResizeObserver to handle layout updates during/after animation
    const resizeObserver = new ResizeObserver(() => {
        layout();
    });
    
    if (navItemsRef.current) {
        resizeObserver.observe(navItemsRef.current);
    }

    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;

      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (navItems) {
        // Start from auto width if possible to avoid measurement issues, or force layout update after
        // To be safe, we rely on ResizeObserver to catch the updates
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, {
          width: 'auto',
          duration: 0.6,
          ease,
          onComplete: layout // Force final layout check
        });
      }
    }

    return () => {
        window.removeEventListener('resize', onResize);
        resizeObserver.disconnect();
    };
  }, [items, ease, initialLoadAnimation]);

  // Dock Visibility Logic
  const dockRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const showDock = () => {
        gsap.to(dock, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    };

    const hideDock = () => {
        if (isHoveredRef.current) return; 
        gsap.to(dock, { y: -100, opacity: 0, duration: 0.6, ease: 'power2.in', overwrite: 'auto' });
    };

    const resetTimer = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        showDock();
        hideTimerRef.current = setTimeout(hideDock, 2000); // Hide after 2s of inactivity
    };

    // Initial check
    resetTimer();

    const onScroll = () => {
        resetTimer();
    };

    const onMouseMove = (e: MouseEvent) => {
        if (e.clientY < 100) { // Show if near top
            resetTimer();
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('mousemove', onMouseMove);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor
  } as React.CSSProperties;

  return (
    <div className="pill-nav-container">
      <nav 
        ref={dockRef}
        className={`pill-nav ${className}`} 
        aria-label="Primary" 
        style={cssVars}
        onMouseEnter={() => {
            isHoveredRef.current = true;
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            const dock = dockRef.current;
            if(dock) gsap.to(dock, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
        }}
        onMouseLeave={() => {
            isHoveredRef.current = false;
            // Restart timer on leave
            hideTimerRef.current = setTimeout(() => {
                const dock = dockRef.current;
                if(dock) gsap.to(dock, { y: -100, opacity: 0, duration: 0.6, ease: 'power2.in', overwrite: 'auto' });
            }, 2000);
        }}
      >

          {logo && (
            <a
                className="pill-logo"
                href={items?.[0]?.href || '#'}
                aria-label="Home"
                onMouseEnter={handleLogoEnter}
                ref={logoRef}
                onClick={(e) => {
                    // Should allow logo click to go usually to home, check if item 0 has onClick
                    if (items[0]?.onClick) {
                        e.preventDefault();
                        items[0].onClick();
                    }
                }}
            >
                <img src={logo} alt={logoAlt} ref={logoImgRef} />
            </a>
          )}

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => (
              <li key={item.href || `item-${i}`} role="none">
                  <a
                    role="menuitem"
                    href={item.href || '#'}
                    className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                    aria-label={item.ariaLabel || item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                    onClick={(e) => {
                        if (item.onClick) {
                            e.preventDefault(); // Prevent default hash/href nav if onClick exists
                            item.onClick();
                        }
                    }}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={el => {
                        circleRefs.current[i] = el;
                      }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item, i) => (
            <li key={item.href || `mobile-item-${i}`}>
                <a
                  href={item.href || '#'}
                  className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                  onClick={(e) => {
                      if (item.onClick) {
                          e.preventDefault();
                          item.onClick();
                      }
                      setIsMobileMenuOpen(false);
                      toggleMobileMenu(); // Force animation close
                  }}
                >
                  {item.label}
                </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
