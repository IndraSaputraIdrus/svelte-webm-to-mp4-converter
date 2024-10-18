// place files you want to import through the `$lib` alias in this folder.
export const downloadVideo = (data: Uint8Array) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  a.download = 'video.mp4';

  setTimeout(() => {
    a.click();
  }, 1000);
};


export const readFile = async (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const { result } = fileReader;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
      }
    };

    fileReader.onerror = () => {
      reject('Could not read file');
    };

    fileReader.readAsArrayBuffer(file);
  });
};
