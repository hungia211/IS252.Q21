import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/sidebar";
import Preprocess from "./pages/preprocess";
import Association from "./pages/association";
import Bayes from "./pages/Bayes";
import Laplace from "./pages/laplace";
import Gini from "./pages/gini";
import Gain from "./pages/gain";
import Kmean from "./pages/kmean";
import Kohonen from "./pages/kohonen";
import Raw from "./pages/raw";



function DummyPage() {
  return <div className="p-6">Content</div>;
}

export default function App() {
  return (
    <BrowserRouter>

      {/* SIDEBAR FIXED */}
      <div className="fixed top-0 left-0 h-screen w-[280px] bg-white shadow z-50">
        <Layout />
      </div>

      {/* CONTENT */}
      <div className="ml-[280px] p-6 min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<DummyPage />} />
          <Route path="/preprocess" element={<Preprocess />} />
          <Route path="/association" element={<Association />} />
          <Route path="/bayes" element={<Bayes />} />
          <Route path="/laplace" element={<Laplace />} />
          <Route path="/gini" element={<Gini />} />
          <Route path="/gain" element={<Gain />} />
          <Route path="/kmeans" element={<Kmean />} />
          <Route path="/kohonen" element={<Kohonen />} />
          <Route path="/raw" element={<Raw />} />
        </Routes>
      </div>

    </BrowserRouter>
  );
}