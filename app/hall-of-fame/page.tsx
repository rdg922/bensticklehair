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
            <div className="space-y-6">
              {topBens.map((ben, index) => (
                <div key={ben.id} className="hall-of-fame-item p-6">
                  <div className="flex items-start gap-6">
                    <div className="text-center">
                      <div className="rank-number text-6xl">#{index + 1}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-2">{ben.name}</h3>
                      <p className="text-xl mb-2">
                        by{" "}
                        <span className="font-bold">
                          {ben.users?.name || "Anonymous"}
                        </span>
                      </p>
                      <p className="text-lg mb-4">{ben.like_count} likes</p>
                      {ben.birthday_message && (
                        <div className="mb-4 p-3 bg-yellow-200 border-l-4 border-yellow-500 rounded">
                          <p className="text-sm font-bold text-yellow-800 mb-1">
                            🎂 BIRTHDAY MESSAGE:
                          </p>
                          <p className="text-sm text-yellow-900">
                            {ben.birthday_message}
                          </p>
                        </div>
                      )}
                      {ben.image_data && (
                        <img
                          src={ben.image_data || "/placeholder.svg"}
                          alt={ben.name}
                          className="border-4 border-purple-500 max-w-xs shadow-lg"
                        />
                      )}
                    </div>
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
