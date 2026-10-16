import {type ChangeEvent, type ReactNode, useCallback} from "react";

import {
    settingKindSchema,
    severitySchema,
    type TSettingKind,
    type TSettingValueOf,
    type TSeverity,
} from "~/domain/setting";

interface ISettingEditorProps<K extends TSettingKind> {
    value: TSettingValueOf<K>;
    onChange: (value: TSettingValueOf<K>) => void;
}

const severityClassNames: Record<TSeverity, string> = {
    [severitySchema.enum.none]: 'text-gray-400',
    [severitySchema.enum.hint]: 'text-teal-300',
    [severitySchema.enum.information]: 'text-sky-300',
    [severitySchema.enum.warning]: 'text-amber-300',
    [severitySchema.enum.error]: 'text-red-400',
};

const SeverityEditor = ({value, onChange}: ISettingEditorProps<'severity'>) => {
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            onChange(severitySchema.parse(event.target.value));
        },
        [onChange],
    );

    return (
        <select
            value={value}
            onChange={handleChange}
            className={`w-32 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs ${severityClassNames[value]}`}
        >
            {severitySchema.options.map((severity) => (
                <option key={severity} value={severity} className={severityClassNames[severity]}>
                    {severity}
                </option>
            ))}
        </select>
    );
};

const BooleanEditor = ({value, onChange}: ISettingEditorProps<'boolean'>) => {
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.checked);
        },
        [onChange],
    );

    return (
        <label className="inline-flex w-32 items-center gap-2 text-xs text-gray-300">
            <input
                type="checkbox"
                checked={value}
                onChange={handleChange}
                className="h-4 w-4 cursor-pointer accent-blue-500"
            />
            {String(value)}
        </label>
    );
};

interface ISettingKindView<K extends TSettingKind> {
    Editor: (props: ISettingEditorProps<K>) => ReactNode;
    valueClassName: (value: TSettingValueOf<K>) => string;
}

export const settingKindViews: {[K in TSettingKind]: ISettingKindView<K>} = {
    [settingKindSchema.enum.severity]: {
        Editor: SeverityEditor,
        valueClassName: (severity) => severityClassNames[severity],
    },
    [settingKindSchema.enum.boolean]: {
        Editor: BooleanEditor,
        valueClassName: (isOn) => (isOn ? 'text-green-300' : 'text-gray-400'),
    },
};
