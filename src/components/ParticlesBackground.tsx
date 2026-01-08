"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    particlesJS: any;
  }
}

/**
 * ParticlesBackground - particles.js integration
 * Subtle, professional particle network effect across all pages
 */
export function ParticlesBackground() {
  useEffect(() => {
    // Dynamically load particles.js library
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js";
    script.async = true;
    
    script.onload = () => {
      if (window.particlesJS) {
        // Initialize particles
        window.particlesJS("particles-js", {
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: "#58d41e"
            },
            shape: {
              type: "circle",
              stroke: {
                width: 0,
                color: "#000000"
              },
              polygon: {
                nb_sides: 5
              },
              image: {
                src: "img/github.svg",
                width: 100,
                height: 100
              }
            },
            opacity: {
              value: 0.5,
              random: false,
              anim: {
                enable: false,
                speed: 1,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 3.9418498312888257,
              random: true,
              anim: {
                enable: false,
                speed: 0,
                size_min: 0.1,
                sync: false
              }
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#ffffff",
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 6,
              direction: "none",
              random: false,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: true,
                mode: "repulse"
              },
              onclick: {
                enable: true,
                mode: "push"
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3
              },
              repulse: {
                distance: 200,
                duration: 0.4
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true
        });
        
        // Ensure the canvas element has proper z-index
        setTimeout(() => {
          const canvas = document.querySelector("#particles-js canvas");
          if (canvas) {
            (canvas as HTMLElement).style.position = "fixed";
            (canvas as HTMLElement).style.zIndex = "-1";
            (canvas as HTMLElement).style.pointerEvents = "none";
          }
        }, 100);
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Destroy particles instance if it exists
      const particlesContainer = document.getElementById("particles-js");
      if (particlesContainer) {
        particlesContainer.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      id="particles-js"
      className="fixed inset-0 pointer-events-none"
    />
  );
}
