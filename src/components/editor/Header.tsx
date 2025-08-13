"use client";

import Button from "../ui/Button";

interface HeaderProps {
  onUploadClick: () => void;
  onAddText: () => void;
}

const Header = ({ onUploadClick, onAddText }: HeaderProps) => {
  return (
    <header className="p-3 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
      <h1 className="text-xl font-bold">Image Text Composer</h1>
      <div className="flex gap-2">
        <Button onClick={onUploadClick}>Upload Image</Button>
        <Button onClick={onAddText}>Add Text</Button>
      </div>
    </header>
  );
};

export default Header;
