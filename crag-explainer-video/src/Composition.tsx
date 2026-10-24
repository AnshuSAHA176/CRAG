import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

export const MyComposition = () => {
  return (
    <Composition
      id="CRAGExplainer"
      component={MainVideo}
      durationInFrames={4500}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
