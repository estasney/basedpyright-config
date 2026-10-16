import {useContext} from "react";

import {ConfigStateContext, type IConfigStateContext} from "~/context/ConfigStateContext";
import {invariant} from "~/lib/invariant";

export const useConfigState = (): IConfigStateContext => {
    const context = useContext(ConfigStateContext);
    invariant(context, 'useConfigState must be used within a ConfigStateProvider');
    return context;
};
