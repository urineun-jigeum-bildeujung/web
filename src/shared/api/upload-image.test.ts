// 이미지 업로드 절차 테스트. 발급에 무엇을 보내고, S3 PUT에 어떤 헤더를 붙이고, 무엇을 돌려주는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { fileExtension, ImageUploadError, uploadImage } from "./upload-image";

const PRESIGNED = {
  uploadUrl: "https://bucket.s3.amazonaws.com/profiles/member-1/uuid.jpg?X-Amz-Signature=sig",
  fileUrl: "https://image.leechs.shop/profiles/member-1/uuid.jpg",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("확장자는 파일 이름에서, 없으면 MIME에서 뽑는다", () => {
  expect(fileExtension(new File([""], "coco.JPG", { type: "image/jpeg" }))).toBe("jpg");
  expect(fileExtension(new File([""], "photo", { type: "image/png" }))).toBe("png");
  // 이름도 MIME도 알 수 없으면 빈 값이다. 허용 여부는 서버가 판단한다
  expect(fileExtension(new File([""], "unknown", { type: "" }))).toBe("");
});

test("발급받은 주소로 pending 태그를 붙여 PUT 하고 fileUrl을 돌려준다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(PRESIGNED))
    .mockResolvedValueOnce(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const file = new File(["bytes"], "coco.jpg", { type: "image/jpeg" });

  await expect(uploadImage(file)).resolves.toBe(PRESIGNED.fileUrl);

  const [issueUrl, issueInit] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(issueUrl).toContain("/members/me/profile-image/presigned-url");
  expect(JSON.parse(String(issueInit.body))).toEqual({ extension: "jpg" });

  const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
  expect(putUrl).toBe(PRESIGNED.uploadUrl);
  expect(putInit.method).toBe("PUT");
  expect(putInit.body).toBe(file);
  const headers = new Headers(putInit.headers);
  // 서명 조건이다. 빠지면 S3가 403으로 거절한다
  expect(headers.get("x-amz-tagging")).toBe("status=pending");
  expect(headers.get("Content-Type")).toBe("image/jpeg");
  // 우리 API가 아니다. 토큰이 S3로 새면 안 된다
  expect(headers.get("Authorization")).toBeNull();
});

test("S3가 거절하면 ImageUploadError를 던진다", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json(PRESIGNED))
      .mockResolvedValueOnce(new Response("<Error/>", { status: 403 })),
  );

  await expect(
    uploadImage(new File([""], "coco.jpg", { type: "image/jpeg" })),
  ).rejects.toBeInstanceOf(ImageUploadError);
});

test("발급 함수를 넘기면 그것으로 주소를 받는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const issue = vi.fn().mockResolvedValue(PRESIGNED);

  await uploadImage(new File([""], "a.png", { type: "image/png" }), issue);

  expect(issue).toHaveBeenCalledWith("png");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
