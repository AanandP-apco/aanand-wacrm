import { ImageResponse } from "next/og";

// Brand icon for Aanand & Co WhatsApp CRM
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
          borderRadius: 8,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 800,
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
