import { SiteHeader } from "@/components/site-header";
import { getHallOfFameBens } from "@/lib/actions";

export default async function HallOfFamePage() {
  const result = await getHallOfFameBens();

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

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage="hall-of-fame" />

        <main>
          {topBens && topBens.length > 0 ? (
            <div className="grid grid-cols-5 gap-6">
              {topBens.map((ben, index) => (
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
                  </div>
                </div>
              ))}
            </div>
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
