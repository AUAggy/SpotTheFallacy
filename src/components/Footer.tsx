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
            Found a bug or a mislabeled question?{" "}
            <a
              href="https://github.com/AUAggy/SpotTheFallacy/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Open an issue on GitHub
            </a>{" "}
            or email{" "}
            <a
              href="mailto:hello+spotthefallacy@miaggy.com"
              className="underline hover:text-foreground transition-colors"
            >
              hello+spotthefallacy@miaggy.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
