import "@testing-library/jest-dom";

/* Auth Mocking */
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue("mock-token"),
  }),
}));

/* Router Mocking */
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: () => null,
    };
  },
}));

/* File Reader Mocking */
jest.mock("browser-image-resizer", () => ({
  readAndCompressImage: async (file: File) => file,
}));

const fileReader = {
  readAsDataURL: jest.fn(),
  result: "data:image/jpeg;base64,",
}

Object.defineProperty(fileReader, 'onload', {
  get() {
    return this._onload;
  },
  set(value) {
    this._onload = value
    // NOTE: in our case, we can just call this directly, since we
    // aren't loading real data
    value();
  }
});

jest.spyOn(global, "FileReader").mockImplementation(
  (() => fileReader) as any as () => FileReader);
