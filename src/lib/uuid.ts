// https://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js

export function shortUUID() {
  // I generate the UID from two parts here
  // to ensure the random number provide enough bits.
  const firstPart = (Math.random() * 46656) | 0;
  const secondPart = (Math.random() * 46656) | 0;
  const firstStr = ("000" + firstPart.toString(36)).slice(-3);
  const secondStr = ("000" + secondPart.toString(36)).slice(-3);
  return firstStr + secondStr;
}
