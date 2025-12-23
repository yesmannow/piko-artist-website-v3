// Preload 3D models to avoid layout pop-in
import { useGLTF } from "@react-three/drei";

// Preload models - this will be called when the module is imported
useGLTF.preload("/3d/music-20.glb");
useGLTF.preload("/3d/earphone-1952.glb");

