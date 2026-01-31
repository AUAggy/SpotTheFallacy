export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground text-center">
          <p>
            A free educational tool by{" "}
            <a
              href="https://miaggy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              miaggy.com
            </a>
          </p>
          <p>
            Questions or feedback?{" "}
            <a
              href="https://signal.me/#eu/wtCGOnxHRTUX7LzOlYb1d4ZAipP_l41CFM_qT1wogl93-5XX3S9JD7Aw0KnZpkYh"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Let us know
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
