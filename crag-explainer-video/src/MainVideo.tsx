import { AbsoluteFill, Sequence, useCurrentFrame, spring, useVideoConfig } from "remotion";
import React from "react";

const scenes = [
  { start: 0, duration: 480, title: "1. The Problem", subtitle: "Standard LLMs hallucinate. CRAG strictly grounds answers in your documents." },
  { start: 480, duration: 390, title: "2. Document Processing", subtitle: "PDFs uploaded -> Django -> Celery Worker (PyMuPDF + NLTK)" },
  { start: 870, duration: 420, title: "3. Embeddings & Storage", subtitle: "Chunks -> Cloudflare @cf/baai/bge-m3 -> 1024d Vectors -> PostgreSQL pgvector" },
  { start: 1290, duration: 450, title: "4. Semantic Retrieval", subtitle: "User asks -> AgentView -> LangGraph -> Cosine Distance Query" },
  { start: 1740, duration: 480, title: "5. Relevance Evaluation", subtitle: "gpt-oss-20b evaluates chunks. Schema: { relevant, score, reason }" },
  { start: 2220, duration: 360, title: "6. Corrective Retrieval", subtitle: "If irrelevant -> retry_node -> Query Rewrite -> Re-query DB" },
  { start: 2580, duration: 420, title: "7. Grounded Generation", subtitle: "Strict system prompt + exact chunks -> Verified Answer" },
  { start: 3000, duration: 420, title: "8. SSE Delivery", subtitle: "on_chain_end -> AgentView -> SSE Stream -> React UI" },
  { start: 3420, duration: 450, title: "9. End-to-end Recap", subtitle: "Upload -> Chunk -> Embed -> Retrieve -> Evaluate -> Retry -> Generate" },
  { start: 3870, duration: 390, title: "10. Architecture Summary", subtitle: "React | Django | Celery | PostgreSQL | Cloudflare | LangGraph" },
  { start: 4260, duration: 240, title: "Inside CRAG", subtitle: "From Documents to Grounded AI Answers" },
];

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111", color: "white", fontFamily: "sans-serif" }}>
      {scenes.map((scene, i) => {
        const isActive = frame >= scene.start && frame < scene.start + scene.duration;
        const progress = spring({ frame: frame - scene.start, fps, config: { damping: 200 } });
        
        if (!isActive) return null;

        return (
          <Sequence key={i} from={scene.start} durationInFrames={scene.duration}>
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 100 }}>
              <h1 style={{ 
                fontSize: 100, 
                fontWeight: "bold", 
                marginBottom: 40,
                textAlign: "center",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 50}px)`,
                color: "#9d4edd"
              }}>
                {scene.title}
              </h1>
              <p style={{
                fontSize: 50,
                textAlign: "center",
                color: "#aaaaaa",
                opacity: progress,
                maxWidth: 1200,
                lineHeight: 1.5
              }}>
                {scene.subtitle}
              </p>
              
              {/* Abstract Visual Elements */}
              <div style={{
                marginTop: 100,
                width: 800,
                height: 400,
                border: "2px solid #333",
                borderRadius: 20,
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                background: "linear-gradient(45deg, #1a1a1a, #2a2a2a)",
                opacity: progress
              }}>
                <div style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "#5a189a", transform: `scale(${progress})` }} />
                <div style={{ width: 100, height: 100, borderRadius: 20, backgroundColor: "#7b2cbf", transform: `rotate(${progress * 180}deg)` }} />
                <div style={{ width: 100, height: 100, backgroundColor: "#9d4edd", opacity: progress }} />
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
