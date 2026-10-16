import {useCallback} from "react";

import {type TTypeCheckingMode, typeCheckingModeSchema} from "~/domain/setting";

interface IModeButtonProps {
    mode: TTypeCheckingMode;
    isActive: boolean;
    overrideCount: number;
    onSelect: (mode: TTypeCheckingMode) => void;
}

const ModeButton = ({mode, isActive, overrideCount, onSelect}: IModeButtonProps) => {
    const handleClick = useCallback(() => {
        onSelect(mode);
    }, [onSelect, mode]);

    return (
        <button
            onClick={handleClick}
            aria-pressed={isActive}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${
                isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
        >
            {mode}
            {overrideCount > 0 ? (
                <span
                    title={`${String(overrideCount)} overrides kept for ${mode}`}
                    className={`px-1.5 rounded-full text-xs ${isActive ? 'bg-blue-800' : 'bg-gray-600 text-amber-300'}`}
                >
                    {overrideCount}
                </span>
            ) : null}
        </button>
    );
};

interface IModePickerProps {
    mode: TTypeCheckingMode;
    overrideCounts: Record<TTypeCheckingMode, number>;
    onChange: (mode: TTypeCheckingMode) => void;
}

export const ModePicker = ({mode, overrideCounts, onChange}: IModePickerProps) => (
    <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="mr-2 text-sm text-gray-300">typeCheckingMode</span>
        {typeCheckingModeSchema.options.map((option) => (
            <ModeButton
                key={option}
                mode={option}
                isActive={option === mode}
                overrideCount={overrideCounts[option]}
                onSelect={onChange}
            />
        ))}
    </div>
);
