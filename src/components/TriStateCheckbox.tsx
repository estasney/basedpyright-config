import {useCallback, useEffect, useRef} from "react";

import type {TGroupSelectionState} from "~/domain/selection";

interface ITriStateCheckboxProps {
    state: TGroupSelectionState;
    disabled: boolean;
    onChange: (isChecked: boolean) => void;
}

export const TriStateCheckbox = ({state, disabled, onChange}: ITriStateCheckboxProps) => {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = state === 'some';
    }, [state]);

    const handleChange = useCallback(() => {
        onChange(state !== 'all');
    }, [onChange, state]);

    return (
        <input
            ref={ref}
            type="checkbox"
            checked={state === 'all'}
            disabled={disabled}
            onChange={handleChange}
            className="h-4 w-4 cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
        />
    );
};
