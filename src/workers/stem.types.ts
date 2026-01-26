export type Float32ArrayBuffer = Float32Array<ArrayBuffer>;
export type StemChannels = Record<string, Float32ArrayBuffer[]>;

export type StemWorkerResult = {
  type: "RESULT";
  id: string;
  stems: StemChannels;
};
