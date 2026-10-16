import {BasedpyrightConfigurator} from "./BasedpyrightConfigurator";
import {ConfigStateProvider} from "./components/ConfigStateProvider";

function App() {
  return (
    <ConfigStateProvider>
      <BasedpyrightConfigurator />
    </ConfigStateProvider>
  )
}

export default App
