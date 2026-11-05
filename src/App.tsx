import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import TelegramPrivacy from "./pages/TelegramPrivacy";
import ResearchStatus from "./pages/ResearchStatus";

// Explicit public surface. Legacy pages stay in source for a separate migration;
// no legacy auth, market feeds or paid-product claims are mounted here.
const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/research" element={<ResearchStatus />} />
      <Route path="/methodology" element={<ResearchStatus />} />
      <Route path="/privacy/telegram" element={<TelegramPrivacy />} />
      <Route path="*" element={<ResearchStatus unavailable />} />
    </Routes>
  </BrowserRouter>
);

export default App;
