import { GitHubIcon } from "./GitHubIcon";

export const GitHubLink = () => {
  return (
    <a 
      className="gh-float" 
      href="https://github.com/alexsousadev/chip8dive" 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label="GitHub" 
      title="GitHub"
    >
      <GitHubIcon />
    </a>
  );
};

