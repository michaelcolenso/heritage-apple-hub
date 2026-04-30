import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { createRouter, authedQuery } from "./middleware";
import { buildPublicUrl, getS3Client, isS3Configured } from "./lib/s3";
import { env } from "./lib/env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "file";
}

export const uploadRouter = createRouter({
  getPresignedUploadUrl: authedQuery
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.enum(ALLOWED_TYPES),
        kind: z.enum(["listing", "avatar"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isS3Configured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Image uploads are not configured on this server",
        });
      }

      const key = `${input.kind}/${ctx.user.id}/${nanoid(12)}-${safeFilename(input.filename)}`;
      const s3 = getS3Client();

      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: env.s3.bucket,
          Key: key,
          ContentType: input.contentType,
        }),
        { expiresIn: 300 },
      );

      return {
        uploadUrl,
        publicUrl: buildPublicUrl(key),
        key,
      };
    }),
});
