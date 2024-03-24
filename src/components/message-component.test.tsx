import { render, screen } from "@testing-library/react";
import { MessageComponent } from "./message-component";

describe("MessageComponent", () => {
  test("generates hyperlinks when there are citations", () => {
    const props = {
      userPicture: "",
      message: {
        id: "1",
        username: "user",
        message: "[doc1]",
        sentAt: Date.now(),
        citations: [{ filepath: "http://example.com" }],
      },
    };
    render(<MessageComponent {...props} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "http://example.com",
    );
  });

  test("renders an image if message.isImage is true", () => {
    const props = {
      userPicture: "",
      message: {
        id: "1",
        username: "user",
        message: "http://example.com/image.jpg",
        sentAt: Date.now(),
        citations: [],
        isImage: true,
      },
    };
    render(<MessageComponent {...props} />);
    // rememebr images are special, because NextJS.
    // so unfortuantely, we can't test for http://example.com/image.jpg directly
    expect(
      screen
        .getByRole("img", { name: /Image uploaded by user/i })
        .getAttribute("src"),
    ).toContain("image.jpg");
  });

  test("renders only text if message.isImage is false", () => {
    const props = {
      userPicture: "",
      message: {
        id: "1",
        username: "user",
        message: "i love syseng <3",
        sentAt: Date.now(),
        citations: [],
      },
    };
    render(<MessageComponent {...props} />);
    expect(screen.getByText("i love syseng <3")).toBeInTheDocument();
  });
});
