import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface Slide {
  id: number;
  title: string;
  content: string;
  image?: string | null;
}

interface GalleryProps {
  slides: Slide[];
}

export function Gallery({ slides }: GalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
          break;
        case "ArrowRight":
          event.preventDefault();
          setCurrentSlide(prev => (prev + 1) % slides.length);
          break;
        case " ":
          event.preventDefault();
          setIsAutoPlaying(prev => !prev);
          break;
        case "Escape":
          event.preventDefault();
          setIsAutoPlaying(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  return (
    <Card className="max-w-6xl mx-auto">
      {/* Header with navigation */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">{currentSlideData.title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAutoPlay}
            title={isAutoPlaying ? "Pause slideshow" : "Auto-play slideshow"}
          >
            {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            title="Previous slide"
          >
            <ChevronLeft size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            title="Next slide"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </CardHeader>

      {/* Slide content */}
      <CardContent className="min-h-[600px] flex">
        {/* Content area */}
        <div
          className={`${currentSlideData.image ? "w-1/2 pr-8" : "w-full"} flex flex-col`}
        >
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mb-6">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-medium mb-3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-6 py-2 bg-muted text-foreground italic mb-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {currentSlideData.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Image area */}
        {currentSlideData.image && (
          <div className="w-1/2 flex items-center justify-center">
            <div className="bg-muted rounded-lg p-8 flex items-center justify-center h-96 w-full">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-sm">Image placeholder</p>
                <p className="text-xs mt-1">{currentSlideData.image}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Slide indicators */}
      <div className="border-t px-6 py-4">
        <div className="flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? "bg-primary"
                  : "bg-muted hover:bg-muted-foreground/20"
              }`}
              title={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard navigation hint */}
      <div className="border-t px-6 py-2 text-center text-xs text-muted-foreground">
        Use arrow keys to navigate • Space to toggle auto-play • Escape to stop
        auto-play
      </div>
    </Card>
  );
}
