import { useEffect } from "react";

interface ScriptProps {
  src: string;
  onLoad?: () => void;
  onSuccess?: () => void;
}

export const Script: React.FC<ScriptProps> = ({ src, onLoad, onSuccess }) => {
  useEffect(() => {
    // Check if script with same src already exists
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      if (onLoad) onLoad();
      if (onSuccess) onSuccess();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.type = "text/javascript";

    const handleLoad = () => {
      if (onLoad) onLoad();
      if (onSuccess) onSuccess();
    };

    script.addEventListener("load", handleLoad);

    // Add script to head with a unique ID to prevent conflicts
    script.id = `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [src]);

  return null;
};

export default Script;
