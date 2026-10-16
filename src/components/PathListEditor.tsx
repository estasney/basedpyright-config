import {type ChangeEvent, type SubmitEvent, useCallback, useState} from "react";

interface IPathChipProps {
    path: string;
    onRemove: (path: string) => void;
}

const PathChip = ({path, onRemove}: IPathChipProps) => {
    const handleRemove = useCallback(() => {
        onRemove(path);
    }, [onRemove, path]);

    return (
        <li className="flex items-center gap-1 rounded bg-gray-700 pl-2 font-mono text-xs text-gray-200">
            {path}
            <button
                onClick={handleRemove}
                title={`Remove ${path}`}
                className="px-1.5 py-0.5 text-gray-400 hover:text-gray-100"
            >
                ×
            </button>
        </li>
    );
};

interface IPathListEditorProps {
    value: readonly string[];
    onChange: (value: readonly string[]) => void;
}

export const PathListEditor = ({value, onChange}: IPathListEditorProps) => {
    const [draft, setDraft] = useState('');

    const handleDraftChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value);
    }, []);

    const handleSubmit = useCallback(
        (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();
            const path = draft.trim();
            if (path !== '' && !value.includes(path)) onChange([...value, path]);
            setDraft('');
        },
        [draft, value, onChange],
    );

    const handleRemove = useCallback(
        (path: string) => {
            onChange(value.filter((entry) => entry !== path));
        },
        [value, onChange],
    );

    return (
        <div className="flex flex-col gap-2">
            {value.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                    {value.map((path) => (
                        <PathChip key={path} path={path} onRemove={handleRemove} />
                    ))}
                </ul>
            ) : null}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={handleDraftChange}
                    placeholder="Add a path or glob"
                    className="flex-1 px-2 py-1 bg-gray-700 text-xs text-gray-100 placeholder-gray-400 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="px-3 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                    Add
                </button>
            </form>
        </div>
    );
};
