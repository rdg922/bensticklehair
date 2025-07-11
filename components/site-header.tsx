interface SiteHeaderProps {
  currentPage?: "home" | "editor" | "hall-of-fame" | "account";
}

export function SiteHeader({ currentPage }: SiteHeaderProps) {
  const getNavLinkClass = (page: string) => {
    const baseClass = "text-md whitespace-break-spaces";
    return currentPage === page
      ? `${baseClass} font-bold glow-text`
      : baseClass;
  };

  return (
    <header className="container-90s p-6 mb-8">
      <h1 className="text-2xl md:text-6xl font-bold mb-4 rainbow-text text-center">
        ✨benjaminstickle.hair✨
      </h1>
      <div className="marquee text-center mb-4">LIFE IS BEAUTIFUL</div>
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
