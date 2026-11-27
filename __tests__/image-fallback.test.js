// An app build made before expo-image was added has no 'ExpoImage' native
// module, and importing expo-image there throws. The wrapper must not crash.

describe("Image wrapper", () => {
  beforeEach(() => jest.resetModules());

  test("old build without ExpoImage: falls back to React Native Image", () => {
    jest.doMock("expo", () => ({ requireOptionalNativeModule: () => null }));
    jest.doMock("expo-image", () => {
      throw new Error("Cannot find native module 'ExpoImage'");
    });
    const { Image: RNImage } = require("react-native");
    let Image;
    expect(() => {
      ({ Image } = require("../src/components/Image"));
    }).not.toThrow();

    const el = Image({ source: { uri: "https://example.com/c.jpg" }, contentFit: "fill" });
    expect(el.type).toBe(RNImage);
    expect(el.props.resizeMode).toBe("stretch");
  });

  test("build with ExpoImage: uses expo-image", () => {
    const FakeExpoImage = () => null;
    jest.doMock("expo", () => ({ requireOptionalNativeModule: () => ({}) }));
    jest.doMock("expo-image", () => ({ Image: FakeExpoImage }));
    const { Image } = require("../src/components/Image");

    const el = Image({ source: { uri: "x" }, contentFit: "cover", transition: 150 });
    expect(el.type).toBe(FakeExpoImage);
    expect(el.props.contentFit).toBe("cover");
  });
});
