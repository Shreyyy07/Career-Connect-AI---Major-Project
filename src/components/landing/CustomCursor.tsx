import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Detect if we are hovering a clickable element
      if (
        window.getComputedStyle(target).cursor === "pointer" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    // Hide default cursor across the page while this component is mounted
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.head.removeChild(style);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Inner Dot - follows instantly */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-[#8b5cf6] rounded-full pointer-events-none z-[10000]"
        animate={{
          x: mousePosition.x - 5,
          y: mousePosition.y - 5,
          scale: isHovering ? 0 : 1, // Shrink dot when hovering
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />
      {/* Outer Ring - follows with spring physics */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border-[1.5px] border-[#8b5cf6] rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0)",
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
      />
    </>
  );
}
