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
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content Area */}
      <div className="md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
            <div className="md:block hidden" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Splits
            </h1>
            <button className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition-colors shadow-sm bg-white border border-gray-200">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>

          {/* Recent Section */}
          <div className="pb-4 sm:pb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Recent
            </h2>

            {/* Mobile Layout */}
            <div className="space-y-3 sm:space-y-4 md:hidden">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-4 py-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <img
                    src={split.image}
                    alt={split.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover mr-3 sm:mr-4"
                  />
                  <div className="flex-1">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {split.name}
                    </div>
                    <div className="text-gray-500 text-sm sm:text-base">
                      {split.category}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
              ))}
            </div>

            {/* Desktop Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <img
                    src={split.image}
                    alt={split.name}
                    className="w-full h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-4">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {split.name}
                    </div>
                    <div className="text-gray-500 text-sm">{split.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* View All Splits */}
          <div className="pt-2 sm:pt-4 pb-20 md:pb-8">
            <button className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl py-3 sm:py-4 bg-white hover:bg-gray-50 transition-colors font-medium text-gray-600 text-base sm:text-lg shadow-sm">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-500" />
              View All Splits
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}