export const useTimeguard = <T extends CallableFunction>(callback: T,
  interval: number): T => {
  let activated = false;

  return () => {
    if (activated) {
      return;
    }

    activated = true;
    callback();
    setTimeout(() => {
      activated = false;
    }, interval);
  }
};
