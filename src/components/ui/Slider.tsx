import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    value: number | string;
}

const Slider = ({ label, value, ...props }: SliderProps) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">{label}</label>
                <span className="text-xs font-mono bg-gray-600 px-1.5 py-0.5 rounded">{value}</span>
            </div>
            <input
                type="range"
                value={value}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                {...props}
            />
        </div>
    );
};

export default Slider;
