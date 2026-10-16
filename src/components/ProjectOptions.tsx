import {type ReactNode, useCallback, useState} from "react";

import {CodeSpans} from "~/components/CodeSpans";
import {PathListEditor} from "~/components/PathListEditor";
import {
    projectOptionKinds,
    projectOptionKindSchema,
    projectOptionNameSchema,
    type TProjectOptionKind,
    type TProjectOptionName,
    type TProjectOptionTitles,
    type TProjectOptionValueOf,
    type TProjectOptionValues,
} from "~/domain/projectOption";
import {configDocsUrl} from "~/domain/setting";

interface IProjectOptionEditorProps<K extends TProjectOptionKind> {
    value: TProjectOptionValueOf<K>;
    onChange: (value: TProjectOptionValueOf<K>) => void;
}

interface IProjectOptionKindView<K extends TProjectOptionKind> {
    Editor: (props: IProjectOptionEditorProps<K>) => ReactNode;
}

const projectOptionKindViews: {[K in TProjectOptionKind]: IProjectOptionKindView<K>} = {
    [projectOptionKindSchema.enum['path-list']]: {Editor: PathListEditor},
};

interface IProjectOptionEditorSlotProps<K extends TProjectOptionKind> extends IProjectOptionEditorProps<K> {
    kind: K;
}

const ProjectOptionEditor = <K extends TProjectOptionKind>({kind, value, onChange}: IProjectOptionEditorSlotProps<K>) => {
    const {Editor} = projectOptionKindViews[kind];
    return <Editor value={value} onChange={onChange} />;
};

interface IProjectOptionRowProps<N extends TProjectOptionName> {
    name: N;
    title: string;
    docsUrl: string;
    value: TProjectOptionValues[N];
    onChange: (name: N, value: TProjectOptionValues[N]) => void;
}

const ProjectOptionRow = <N extends TProjectOptionName>({name, title, docsUrl, value, onChange}: IProjectOptionRowProps<N>) => {
    const handleChange = useCallback(
        (next: TProjectOptionValues[N]) => {
            onChange(name, next);
        },
        [onChange, name],
    );

    return (
        <tr className="border-t border-gray-700 align-top">
            <td className="w-48 px-6 py-3 font-mono text-xs font-medium">
                <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                    {name}
                </a>
            </td>
            <td className="w-80 px-3 py-3 text-xs text-gray-400">
                <CodeSpans text={title} />
            </td>
            <td className="px-3 py-3">
                <ProjectOptionEditor kind={projectOptionKinds[name]} value={value} onChange={handleChange} />
            </td>
        </tr>
    );
};

interface IProjectOptionsProps {
    basedpyrightVersion: string;
    titles: TProjectOptionTitles;
    values: TProjectOptionValues;
    onChange: <N extends TProjectOptionName>(name: N, value: TProjectOptionValues[N]) => void;
}

export const ProjectOptions = ({basedpyrightVersion, titles, values, onChange}: IProjectOptionsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    return (
        <div className="bg-gray-800 rounded-b-lg shadow-lg overflow-hidden mb-4">
            <button
                onClick={handleToggle}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between pl-6 pr-4 py-3 text-left text-sm bg-gray-700/40 hover:bg-gray-700"
            >
                <span className="font-bold text-gray-200">Project Options</span>
                <span className="font-sans text-base text-gray-400">{isExpanded ? '▾' : '▸'}</span>
            </button>

            {isExpanded ? (
                <table className="w-full text-sm border-t border-gray-700">
                    <tbody>
                        {projectOptionNameSchema.options.map((name) => (
                            <ProjectOptionRow
                                key={name}
                                name={name}
                                title={titles[name]}
                                docsUrl={configDocsUrl(basedpyrightVersion, name)}
                                value={values[name]}
                                onChange={onChange}
                            />
                        ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
};
