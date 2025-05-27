import React from "react";
import { Plus, ChevronRight, Home, Users, Bell, FileText } from "lucide-react";
import BottomNav from "../components/BottomNav";
const splits = [
  {
    id: 1,
    name: "The Italian Place",
    category: "Dinner",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "The Bar",
    category: "Drinks",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    name: "Whole Foods",
    category: "Groceries",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
  },
];

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div />
        <h1 className="text-3xl font-bold text-gray-900">Splits</h1>
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <Plus className="w-6 h-6 text-gray-900" />
        </button>
      </div>

      {/* Recent */}
      <div className="px-6 pb-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent</h2>
        <div className="space-y-4">
          {splits.map((split) => (
            <div
              key={split.id}
              className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 hover:shadow-md transition cursor-pointer"
            >
              <img
                src={split.image}
                alt={split.name}
                className="w-16 h-16 rounded-xl object-cover mr-4"
              />
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900">
                  {split.name}
                </div>
                <div className="text-gray-400 text-base">{split.category}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* View All Splits */}
      <div className="px-6 pt-4">
        <button className="w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-4 bg-gray-50 hover:bg-gray-100 transition font-medium text-gray-500 text-lg">
          <FileText className="w-6 h-6 mr-2 text-gray-400" />
          View All Splits
        </button>
      </div>

      <div className="flex-1" />

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}