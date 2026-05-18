import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SubmitPage } from "./pages/SubmitPage";
import { FeedbackListPage } from "./pages/FeedbackListPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SubmitPage />} />
        <Route path="/feedback" element={<FeedbackListPage />} />
      </Routes>
    </Layout>
  );
}
