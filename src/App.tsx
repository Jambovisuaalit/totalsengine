import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/Landing";
import AnalysisIndex from "@/pages/AnalysisIndex";
import Methodology from "@/pages/Methodology";
import Performance from "@/pages/Performance";
import UnavailableFeature from "@/pages/UnavailableFeature";
import TelegramPrivacy from "@/pages/TelegramPrivacy";
const queryClient = new QueryClient();
export default function App(){
 return <QueryClientProvider client={queryClient}><Toaster/><BrowserRouter><Routes>
  <Route path="/" element={<Landing/>}/>
  <Route path="/analysis" element={<AnalysisIndex/>}/>
  <Route path="/methodology" element={<Methodology/>}/>
  <Route path="/performance" element={<Performance/>}/>
  <Route path="/privacy/telegram" element={<TelegramPrivacy/>}/>
  <Route path="*" element={<UnavailableFeature/>}/>
 </Routes></BrowserRouter></QueryClientProvider>;
}
