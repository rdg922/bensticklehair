interface SiteHeaderProps {
  marqueeText: string;
  currentPage?: "home" | "editor" | "hall-of-fame" | "account";
}

export function SiteHeader({ marqueeText, currentPage }: SiteHeaderProps) {
  const getNavLinkClass = (page: string) => {
    const baseClass = "text-2xl";
    return currentPage === page
      ? `${baseClass} font-bold glow-text`
      : baseClass;
  };

  return (
    <header className="container-90s p-6 mb-8">
      <h1 className="text-6xl font-bold mb-4 rainbow-text text-center">
        ✨ benstickle.hair✨
      </h1>
      <div className="marquee text-center mb-4">{marqueeText}</div>
      <nav className="text-center space-x-6">
        <a href="/" className={getNavLinkClass("home")}>
          HOME
        </a>
        <a href="/editor" className={getNavLinkClass("editor")}>
          DRAW BEN
        </a>
        <a href="/hall-of-fame" className={getNavLinkClass("hall-of-fame")}>
          HALL OF FAME
        </a>
        <a href="/account" className={getNavLinkClass("account")}>
          ACCOUNT
        </a>
      </nav>
    </header>
  );
}
