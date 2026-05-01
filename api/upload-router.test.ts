import { beforeEach, describe, expect, it, vi } from "vitest";

const putCommandSpy = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class PutObjectCommand {
    public input: unknown;
    constructor(input: unknown) {
      this.input = input;
      putCommandSpy(input);
    }
  }
  class S3Client {
    constructor() {}
  }
  return { PutObjectCommand, S3Client };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/upload"),
}));

vi.mock("./lib/s3", () => ({
  isS3Configured: () => true,
  getS3Client: () => ({}),
  buildPublicUrl: (key: string) => `https://cdn.example/${key}`,
}));

vi.mock("./lib/env", () => ({
  env: {
    appUrl: "http://test.local",
    stripe: { secretKey: "", webhookSecret: "" },
    s3: {
      endpoint: "",
      region: "auto",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucket: "test-bucket",
      publicBaseUrl: "https://cdn.example",
    },
  },
}));

import { uploadRouter } from "./upload-router";

function caller(userId: number) {
  return uploadRouter.createCaller({
    req: new Request("http://localhost/api/trpc/upload"),
    resHeaders: new Headers(),
    user: {
      id: userId,
      role: "user",
      email: null,
      unionId: "u",
      name: null,
      avatar: null,
      hardinessZone: null,
      location: null,
      bio: null,
      isVerifiedSeller: false,
      sellerVerificationRequested: false,
      stripeConnectId: null,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    },
  });
}

describe("uploadRouter.getPresignedUploadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the key prefix per user and kind, and returns a public URL", async () => {
    const result = await caller(42).getPresignedUploadUrl({
      filename: "tree photo.jpg",
      contentType: "image/jpeg",
      kind: "listing",
    });

    expect(result.uploadUrl).toBe("https://signed.example/upload");
    expect(result.key.startsWith("listing/42/")).toBe(true);
    expect(result.key.endsWith("-tree-photo.jpg")).toBe(true);
    expect(result.publicUrl).toBe(`https://cdn.example/${result.key}`);

    expect(putCommandSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "test-bucket",
        ContentType: "image/jpeg",
      }),
    );
  });

  it("rejects unsupported content types via zod validation", async () => {
    await expect(
      caller(1).getPresignedUploadUrl({
        filename: "x.gif",
        // @ts-expect-error - intentionally invalid content type
        contentType: "image/gif",
        kind: "avatar",
      }),
    ).rejects.toBeDefined();
  });
});
