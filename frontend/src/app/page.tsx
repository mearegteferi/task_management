import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import Board from "@/components/Board";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col px-6 overflow-hidden">
        <FilterBar />
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <Board />
        </div>
      </main>
    </div>
  );
}
