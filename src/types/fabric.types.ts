import { fabric } from 'fabric';

// Define all the specific Fabric object types your canvas can hold.
// Add any other types you use, like fabric.Rect, fabric.Circle, etc.
type CanvasObject = fabric.IText | fabric.Image | fabric.Group;

// Create and export your custom type by intersecting the union
// with your custom properties (like an ID).
export type CustomFabricObject = CanvasObject & {
    id: string; // Or any other custom properties you add
};
