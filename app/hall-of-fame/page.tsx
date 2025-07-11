"use client";

import { SiteHeader } from "@/components/site-header";
import { getHallOfFameBens } from "@/lib/actions";
import { useState, useEffect } from "react";

export default function HallOfFamePage() {
  const [result, setResult] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Fetch data
    async function fetchData() {
      const data = await getHallOfFameBens();
      setResult(data);
    }

    fetchData();

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <SiteHeader currentPage="hall-of-fame" />
          <main>
            <div className="container-yellow p-8 text-center">
              <h3 className="text-3xl font-bold mb-4">LOADING LEGENDS...</h3>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if ("error" in result) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <SiteHeader currentPage="hall-of-fame" />
          <main>
            <div className="container-yellow p-8 text-center">
              <h3 className="text-3xl font-bold mb-4">
                OOPS! ERROR LOADING LEGENDS
              </h3>
              <p className="text-xl">{result.error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const topBens = result.data;
  const mobileBens = isMobile ? topBens?.slice(0, 5) : topBens; // Only top 5 on mobile

  const nextSlide = () => {
    if (mobileBens && currentIndex < mobileBens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage="hall-of-fame" />

        <main>
          {topBens && topBens.length > 0 ? (
            <>
              {/* Mobile Carousel - Web 1.0 Style */}
              {isMobile ? (
                <div className="block md:hidden">
                  <div className="container-yellow p-4 mb-4">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-bold">★ TOP 5 LEGENDS ★</h2>
                      <p className="text-sm">
                        ({currentIndex + 1} of {mobileBens?.length || 0})
                      </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mb-4">
                      <button
                        onClick={prevSlide}
                        disabled={currentIndex === 0}
                        className={`
                          px-4 py-2 font-bold text-lg
                          ${
                            currentIndex === 0
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                        style={{
                          fontFamily: "monospace",
                          background:
                            currentIndex === 0 ? "#808080" : "#00FF00",
                          color: currentIndex === 0 ? "#C0C0C0" : "#000000",
                          border: "4px solid",
                          borderTopColor:
                            currentIndex === 0 ? "#A0A0A0" : "#40FF40",
                          borderLeftColor:
                            currentIndex === 0 ? "#A0A0A0" : "#40FF40",
                          borderRightColor:
                            currentIndex === 0 ? "#606060" : "#00CC00",
                          borderBottomColor:
                            currentIndex === 0 ? "#606060" : "#00CC00",
                          boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        &lt; PREV
                      </button>

                      <div className="text-center">
                        <div className="rank-number text-4xl font-bold">
                          RANK #{currentIndex + 1}
                        </div>
                      </div>

                      <button
                        onClick={nextSlide}
                        disabled={
                          !mobileBens || currentIndex >= mobileBens.length - 1
                        }
                        className={`
                          px-4 py-2 font-bold text-lg
                          ${
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                        style={{
                          fontFamily: "monospace",
                          background:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#808080"
                              : "#00FF00",
                          color:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#C0C0C0"
                              : "#000000",
                          border: "4px solid",
                          borderTopColor:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#A0A0A0"
                              : "#40FF40",
                          borderLeftColor:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#A0A0A0"
                              : "#40FF40",
                          borderRightColor:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#606060"
                              : "#00CC00",
                          borderBottomColor:
                            !mobileBens || currentIndex >= mobileBens.length - 1
                              ? "#606060"
                              : "#00CC00",
                          boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        NEXT &gt;
                      </button>
                    </div>

                    {/* Current Ben Display */}
                    {mobileBens && mobileBens[currentIndex] && (
                      <div className="hall-of-fame-item p-4">
                        <div className="text-center mb-4">
                          <h3 className="text-2xl font-bold border-b-2 border-current pb-2">
                            {mobileBens[currentIndex].name}
                          </h3>
                          <p className="text-lg mt-2">
                            BY:{" "}
                            <strong>
                              {mobileBens[currentIndex].users?.name ||
                                "ANONYMOUS"}
                            </strong>
                          </p>
                          <p className="text-lg">
                            ★ {mobileBens[currentIndex].like_count} LIKES ★
                          </p>
                        </div>

                        {mobileBens[currentIndex].image_data && (
                          <div className="text-center mb-4">
                            <img
                              src={
                                mobileBens[currentIndex].image_data ||
                                "/placeholder.svg"
                              }
                              alt={mobileBens[currentIndex].name}
                              className="border-4 border-purple-500 max-w-full h-auto mx-auto shadow-lg"
                              style={{
                                maxHeight: "300px",
                              }}
                            />
                          </div>
                        )}

                        {mobileBens[currentIndex].birthday_message && (
                          <div className="mb-3 p-2 bg-yellow-200 border-l-4 border-yellow-500 rounded text-xs">
                            <p className="font-bold text-yellow-800 mb-1">
                              🎂 BIRTHDAY MESSAGE:
                            </p>
                            <p className="text-yellow-900">
                              {mobileBens[currentIndex].birthday_message}
                            </p>
                          </div>
                        )}

                        {/* See More Button */}
                        <div className="text-center mt-4">
                          <button
                            onClick={() =>
                              (window.location.href = `/ben/${mobileBens[currentIndex].id}`)
                            }
                            className="px-6 py-3 font-bold text-lg cursor-pointer"
                            style={{
                              fontFamily: "monospace",
                              background: "#4facfe",
                              border: "4px solid",
                              borderTopColor: "#7fc7ff",
                              borderLeftColor: "#7fc7ff",
                              borderRightColor: "#0066cc",
                              borderBottomColor: "#0066cc",
                              color: "#2c3e50",
                              boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            &gt;&gt;&gt; SEE MORE &lt;&lt;&lt;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Desktop Grid - Hidden on Mobile */}
              <div className="hidden md:block">
                <div className="grid grid-cols-5 gap-6">
                  {topBens.map((ben: any, index: number) => (
                    <div key={ben.id} className="hall-of-fame-item p-4">
                      <div className="text-center mb-3">
                        <div className="rank-number text-4xl font-bold">
                          #{index + 1}
                        </div>
                      </div>
                      {ben.image_data && (
                        <div className="flex-1 flex items-center justify-center">
                          <img
                            src={ben.image_data || "/placeholder.svg"}
                            alt={ben.name}
                            className="border-4 border-purple-500 w-full h-auto max-w-full shadow-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-2 text-center">
                          {ben.name}
                        </h3>
                        <p className="text-sm mb-2 text-center">
                          by{" "}
                          <span className="font-bold">
                            {ben.users?.name || "Anonymous"}
                          </span>
                        </p>
                        <p className="text-sm mb-3 text-center font-semibold">
                          {ben.like_count} likes
                        </p>
                        {ben.birthday_message && (
                          <div className="mb-3 p-2 bg-yellow-200 border-l-4 border-yellow-500 rounded text-xs">
                            <p className="font-bold text-yellow-800 mb-1">
                              🎂 BIRTHDAY MESSAGE:
                            </p>
                            <p className="text-yellow-900">
                              {ben.birthday_message}
                            </p>
                          </div>
                        )}

                        {/* See More Button */}
                        <div className="text-center mt-auto pt-3">
                          <button
                            onClick={() =>
                              (window.location.href = `/ben/${ben.id}`)
                            }
                            className="px-3 py-2 font-bold text-sm cursor-pointer w-full"
                            style={{
                              fontFamily: "monospace",
                              background: "#4facfe",
                              border: "4px solid",
                              borderTopColor: "#7fc7ff",
                              borderLeftColor: "#7fc7ff",
                              borderRightColor: "#0066cc",
                              borderBottomColor: "#0066cc",
                              color: "#2c3e50",
                              boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            SEE MORE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="container-yellow p-8 text-center">
              <h3 className="text-3xl font-bold mb-4">NO LEGENDS YET</h3>
              <p className="text-xl">Be the first to enter the Hall of Fame</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
