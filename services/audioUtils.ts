
export async function sliceAudio(file: File, start: number, end: number): Promise<Blob> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  
  // CONFIGURAÇÃO DO SILÊNCIO INICIAL
  const silenceDuration = 0.5; // 500ms de silêncio absoluto no início
  const silenceFrames = Math.floor(silenceDuration * sampleRate);

  // Calcula os frames de corte com precisão
  const startFrame = Math.floor(start * sampleRate);
  const endFrame = Math.floor(end * sampleRate);
  const dataFrameCount = endFrame - startFrame;

  if (dataFrameCount <= 0) throw new Error("Duração de fatia inválida");

  // O buffer final terá o tamanho do áudio cortado + o silêncio inicial
  const totalFrameCount = dataFrameCount + silenceFrames;

  const slicedBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    totalFrameCount,
    sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const newChannelData = slicedBuffer.getChannelData(channel);
    
    // 1. Os primeiros 'silenceFrames' permanecem como 0 (silêncio) automaticamente na criação do buffer
    
    // 2. Copiamos os dados originais DEPOIS do silêncio
    // subarray(start, end) pega o trecho exato
    const segmentData = originalData.subarray(startFrame, endFrame);
    
    // set(array, offset) cola os dados a partir do offset (que é o tamanho do silêncio)
    newChannelData.set(segmentData, silenceFrames);
  }

  return audioBufferToWavBlob(slicedBuffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferWav = new ArrayBuffer(length);
  const view = new DataView(bufferWav);
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
      sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
    if (offset > buffer.length) break;
  }

  return new Blob([bufferWav], { type: 'audio/wav' });
}
