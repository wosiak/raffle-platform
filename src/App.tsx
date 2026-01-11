import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import NewDraw from "@/pages/NewDraw";
import DrawHistory from "@/pages/DrawHistory";
import CreateRaffle from "@/pages/CreateRaffle";
import Raffles from "@/pages/Raffles";
import Campaigns from "@/pages/Campaigns";
import CampaignEntries from "@/pages/CampaignEntries";
import CampaignLanding from "@/pages/CampaignLanding";
import Members from "@/pages/Members";
import Partners from "@/pages/Partners";
import Settings from "@/pages/Settings";
import Testimonials from "@/pages/Testimonials";
import ThankYou from "@/pages/ThankYou";
import Wallet from "@/pages/Wallet";
import { appRoutes } from "@/utils";
import TopNavbar from "@/components/layout/TopNavbar";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNavbar />
      <main className="pt-24 pb-10">
        <Routes>
          <Route path={appRoutes.Home} element={<Home />} />
          <Route path={appRoutes.NewDraw} element={<NewDraw />} />
          <Route path={appRoutes.DrawHistory} element={<DrawHistory />} />
          <Route path={appRoutes.CreateRaffle} element={<CreateRaffle />} />
          <Route path={appRoutes.Raffles} element={<Raffles />} />
          <Route path={appRoutes.Campaigns} element={<Campaigns />} />
          <Route path={appRoutes.CampaignEntries} element={<CampaignEntries />} />
          <Route path={appRoutes.CampaignLanding} element={<CampaignLanding />} />
          <Route path={appRoutes.Members} element={<Members />} />
          <Route path={appRoutes.Partners} element={<Partners />} />
          <Route path={appRoutes.Settings} element={<Settings />} />
          <Route path={appRoutes.Testimonials} element={<Testimonials />} />
          <Route path={appRoutes.ThankYou} element={<ThankYou />} />
          <Route path={appRoutes.Wallet} element={<Wallet />} />
          <Route path="*" element={<Navigate to={appRoutes.Home} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

